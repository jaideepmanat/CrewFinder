import { useState } from 'react';
import { doc, setDoc, getDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function FirebaseDiagnostic() {
  const [results, setResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [quickTesting, setQuickTesting] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDiagnostics = async () => {
    setTesting(true);
    setResults([]);
    
    addResult('🔍 Starting Firebase Firestore diagnostics...');
    
    // Check Firebase configuration first
    addResult('🔧 Checking Firebase configuration...');
    addResult(`Project ID: ${db.app.options.projectId}`);
    addResult(`Auth Domain: ${db.app.options.authDomain}`);
    
    // Check if Firestore is properly initialized
    try {
      addResult('🗄️ Checking Firestore initialization...');
      addResult(`Firestore type: ${db.type || 'unknown'}`);
      addResult('Firestore instance seems properly initialized');
    } catch (e) {
      addResult(`⚠️ Firestore info error: ${e}`);
    }

    try {
      // Test 1: Basic connection
      addResult('📡 Testing basic Firestore connection...');
      const testDoc = doc(db, 'test', 'diagnostic');
      
      // Test 2: Write operation
      addResult('✍️ Testing write operation...');
      const writeStart = Date.now();
      await setDoc(testDoc, {
        message: 'diagnostic test',
        timestamp: new Date().toISOString()
      });
      const writeTime = Date.now() - writeStart;
      addResult(`✅ Write successful (${writeTime}ms)`);

      // Test 3: Read operation
      addResult('📖 Testing read operation...');
      const readStart = Date.now();
      const docSnap = await getDoc(testDoc);
      const readTime = Date.now() - readStart;
      
      if (docSnap.exists()) {
        addResult(`✅ Read successful (${readTime}ms) - Data: ${JSON.stringify(docSnap.data())}`);
      } else {
        addResult('❌ Read failed - Document does not exist');
      }

      // Test 4: Collection add
      addResult('📝 Testing collection add...');
      const addStart = Date.now();
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'collection test',
        timestamp: new Date().toISOString()
      });
      const addTime = Date.now() - addStart;
      addResult(`✅ Collection add successful (${addTime}ms) - ID: ${docRef.id}`);

      // Test 5: Delete operation
      addResult('🗑️ Testing delete operation...');
      const deleteStart = Date.now();
      await deleteDoc(testDoc);
      await deleteDoc(docRef);
      const deleteTime = Date.now() - deleteStart;
      addResult(`✅ Delete successful (${deleteTime}ms)`);

      addResult('🎉 All tests completed successfully!');
      
      // Performance summary
      addResult(`📊 Performance Summary:`);
      addResult(`- Write: ${writeTime}ms`);
      addResult(`- Read: ${readTime}ms`);
      addResult(`- Add: ${addTime}ms`);
      addResult(`- Delete: ${deleteTime}ms`);
      
      if (writeTime > 3000 || readTime > 3000 || addTime > 3000 || deleteTime > 3000) {
        addResult('⚠️ WARNING: Some operations took longer than 3 seconds. This indicates slow Firestore connection.');
      }

    } catch (error: any) {
      addResult(`❌ Test failed: ${error.message}`);
      addResult(`🔍 Error code: ${error.code || 'unknown'}`);
      
      // Check for common Firestore setup issues
      if (error.code === 'failed-precondition' || error.message.includes('database')) {
        addResult('');
        addResult('🚨 LIKELY ISSUE: Firestore database not set up!');
        addResult('📋 TO FIX:');
        addResult('1. Go to Firebase Console');
        addResult('2. Click "Firestore Database" (not Realtime Database)');
        addResult('3. Click "Create database"');
        addResult('4. Choose "Start in test mode"');
        addResult('5. Select a location close to you');
        addResult('');
      } else if (error.code === 'permission-denied') {
        addResult('');
        addResult('🚨 ISSUE: Permission denied - check Firestore rules');
        addResult('📋 Ensure your rules allow authenticated users to read/write');
        addResult('');
      }
      
      addResult(`🔍 Full error details: ${JSON.stringify(error, null, 2)}`);
    } finally {
      setTesting(false);
    }
  };

  const quickTest = async () => {
    setQuickTesting(true);
    setResults([]);
    
    addResult('⚡ Running quick Firestore test...');
    
    try {
      // Simple write test
      addResult('📝 Testing simple write...');
      const testRef = await addDoc(collection(db, 'test'), {
        message: 'Quick test',
        timestamp: new Date().toISOString()
      });
      addResult(`✅ Write successful! Document ID: ${testRef.id}`);
      
      // Clean up
      await deleteDoc(testRef);
      addResult('🗑️ Cleanup successful');
      addResult('🎉 Quick test PASSED - Firestore is working!');
      
    } catch (error: any) {
      addResult(`❌ Quick test FAILED: ${error.message}`);
      addResult(`Error code: ${error.code || 'unknown'}`);
      
      if (error.code === 'failed-precondition') {
        addResult('');
        addResult('🚨 FIRESTORE NOT SET UP!');
        addResult('Go to Firebase Console > Firestore Database > Create database');
      }
    } finally {
      setQuickTesting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔧 Firebase Firestore Diagnostics</h2>
      
      <div className="mb-4 space-x-2">
        <button
          onClick={runDiagnostics}
          disabled={testing || quickTesting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {testing ? '⏳ Running Tests...' : '🚀 Run Full Diagnostics'}
        </button>
        
        <button
          onClick={quickTest}
          disabled={testing || quickTesting}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {quickTesting ? '⏳ Testing...' : '⚡ Quick Test'}
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        {results.length === 0 ? (
          <p className="text-gray-600 italic">Click "Run Diagnostics" to start testing...</p>
        ) : (
          <div className="space-y-1">
            {results.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>What this tests:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Basic Firestore connection</li>
          <li>Document write/read operations</li>
          <li>Collection add operations</li>
          <li>Document deletion</li>
          <li>Performance timing for each operation</li>
        </ul>
        <p className="mt-2"><strong>Expected times:</strong> Most operations should complete in under 1-2 seconds with good internet.</p>
      </div>
    </div>
  );
}
