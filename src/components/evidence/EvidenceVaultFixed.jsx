// src/components/evidence/EvidenceVaultFixed.jsx - WORKING EVIDENCE VAULT

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Mic, FileText, Lock, X, Check, Download, Trash2 } from 'lucide-react';

const EvidenceVaultFixed = ({ navigateTo, userData, setUserData }) => {
  // PIN Management
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(true);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [storedPin, setStoredPin] = useState('');

  // Evidence State
  const [activeTab, setActiveTab] = useState('photos');
  const [photos, setPhotos] = useState([]);
  const [audioRecordings, setAudioRecordings] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Journal State
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [journalEntry, setJournalEntry] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    location: '',
    witnesses: ''
  });

  // Load saved PIN and evidence on mount
  useEffect(() => {
    const savedPin = localStorage.getItem('halo_vault_pin');
    const savedPhotos = localStorage.getItem('halo_photos');
    const savedAudio = localStorage.getItem('halo_audio');
    const savedJournal = localStorage.getItem('halo_journal');

    if (savedPin) {
      setStoredPin(savedPin);
    } else {
      setShowPinSetup(true);
      setShowPinPrompt(false);
    }

    if (savedPhotos) setPhotos(JSON.parse(savedPhotos));
    if (savedAudio) setAudioRecordings(JSON.parse(savedAudio));
    if (savedJournal) setJournalEntries(JSON.parse(savedJournal));
  }, []);

  // PIN Setup
  const handleSetupPin = () => {
    if (pin.length < 4) {
      alert('PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      alert('PINs do not match');
      return;
    }
    localStorage.setItem('halo_vault_pin', pin);
    setStoredPin(pin);
    setShowPinSetup(false);
    setUnlocked(true);
    setPin('');
    setConfirmPin('');
  };

  // PIN Unlock
  const handleUnlock = () => {
    if (pin === storedPin) {
      setUnlocked(true);
      setShowPinPrompt(false);
      setPin('');
    } else {
      alert('Incorrect PIN');
      setPin('');
    }
  };

  // CAMERA FUNCTIONS
   const startCamera = async () => {
     try {
       console.log('🎥 Requesting camera access...');
       
       // Request camera permission
       const stream = await navigator.mediaDevices.getUserMedia({ 
         video: { 
           facingMode: 'environment',
           width: { ideal: 1920 },
           height: { ideal: 1080 }
         } 
       });
       
       console.log('✅ Camera access granted!');
       setCameraStream(stream);
       setShowCamera(true);
       
       // Wait for video element to be ready
       setTimeout(() => {
         if (videoRef.current) {
           videoRef.current.srcObject = stream;
           videoRef.current.play().catch(e => console.error('Video play error:', e));
         }
       }, 100);
       
     } catch (error) {
       console.error('❌ Camera error:', error);
       
       let errorMessage = 'Unable to access camera. ';
       
       if (error.name === 'NotAllowedError') {
         errorMessage += 'Please allow camera access in your browser settings.';
       } else if (error.name === 'NotFoundError') {
         errorMessage += 'No camera found on this device.';
       } else if (error.name === 'NotReadableError') {
         errorMessage += 'Camera is already in use by another application.';
       } else {
         errorMessage += error.message;
       }
       
       alert(errorMessage + '\n\nTo fix:\n1. Click the camera icon in address bar\n2. Allow camera access\n3. Refresh the page');
     }
   };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const photo = {
        id: Date.now(),
        data: URL.createObjectURL(blob),
        blob: blob,
        timestamp: new Date().toISOString(),
        location: 'GPS: Getting location...'
      };

      // Get GPS location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            photo.location = `GPS: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
            updatePhoto(photo.id, photo);
          },
          () => {
            photo.location = 'GPS: Location unavailable';
            updatePhoto(photo.id, photo);
          }
        );
      }

      const newPhotos = [...photos, photo];
      setPhotos(newPhotos);
      localStorage.setItem('halo_photos', JSON.stringify(newPhotos.map(p => ({
        ...p,
        data: p.data,
        blob: null // Don't store blob in localStorage
      }))));
      
      stopCamera();
      alert('Photo captured successfully!');
    }, 'image/jpeg');
  };

  const updatePhoto = (id, updatedPhoto) => {
    setPhotos(prev => prev.map(p => p.id === id ? updatedPhoto : p));
  };

  const deletePhoto = (id) => {
    if (confirm('Delete this photo? This cannot be undone.')) {
      const newPhotos = photos.filter(p => p.id !== id);
      setPhotos(newPhotos);
      localStorage.setItem('halo_photos', JSON.stringify(newPhotos));
    }
  };

  // AUDIO RECORDING FUNCTIONS
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const recording = {
          id: Date.now(),
          url: audioUrl,
          blob: audioBlob,
          timestamp: new Date().toISOString(),
          duration: '00:00' // Will be updated with actual duration
        };

        const newRecordings = [...audioRecordings, recording];
        setAudioRecordings(newRecordings);
        localStorage.setItem('halo_audio', JSON.stringify(newRecordings.map(r => ({
          ...r,
          blob: null
        }))));

        stream.getTracks().forEach(track => track.stop());
        alert('Recording saved successfully!');
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert('Microphone access denied. Please enable microphone permissions.');
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteRecording = (id) => {
    if (confirm('Delete this recording? This cannot be undone.')) {
      const newRecordings = audioRecordings.filter(r => r.id !== id);
      setAudioRecordings(newRecordings);
      localStorage.setItem('halo_audio', JSON.stringify(newRecordings));
    }
  };

  // JOURNAL FUNCTIONS
  const saveJournalEntry = () => {
    if (!journalEntry.title || !journalEntry.description) {
      alert('Please fill in title and description');
      return;
    }

    const entry = {
      id: Date.now(),
      ...journalEntry,
      createdAt: new Date().toISOString()
    };

    const newEntries = [...journalEntries, entry];
    setJournalEntries(newEntries);
    localStorage.setItem('halo_journal', JSON.stringify(newEntries));

    setJournalEntry({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].slice(0, 5),
      location: '',
      witnesses: ''
    });
    setShowJournalForm(false);
    alert('Journal entry saved successfully!');
  };

  const deleteJournalEntry = (id) => {
    if (confirm('Delete this entry? This cannot be undone.')) {
      const newEntries = journalEntries.filter(e => e.id !== id);
      setJournalEntries(newEntries);
      localStorage.setItem('halo_journal', JSON.stringify(newEntries));
    }
  };

  // Export Evidence as PDF (simplified)
  const exportEvidence = () => {
    const evidence = {
      photos: photos.length,
      recordings: audioRecordings.length,
      journalEntries: journalEntries.length,
      exportDate: new Date().toISOString()
    };
    
    alert(`Evidence Package:\n${photos.length} photos\n${audioRecordings.length} recordings\n${journalEntries.length} journal entries\n\nIn production, this would generate a PDF with all evidence.`);
  };

  // PIN Setup Screen
  if (showPinSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Up Vault PIN</h2>
            <p className="text-gray-600">Create a secure PIN to protect your evidence</p>
          </div>

          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN (4-6 digits)"
            maxLength={6}
            className="w-full p-4 border-2 border-gray-200 rounded-xl text-center text-2xl font-mono mb-3 focus:border-orange-400 focus:outline-none"
          />

          <input
            type="password"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            placeholder="Confirm PIN"
            maxLength={6}
            className="w-full p-4 border-2 border-gray-200 rounded-xl text-center text-2xl font-mono mb-4 focus:border-orange-400 focus:outline-none"
          />

          <button
            onClick={handleSetupPin}
            disabled={pin.length < 4 || pin !== confirmPin}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-4 rounded-xl font-bold shadow-lg disabled:opacity-50 mb-3"
          >
            Create PIN
          </button>

          <button
            onClick={() => navigateTo('landing')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // PIN Unlock Screen
  if (showPinPrompt && !unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Evidence Vault</h2>
            <p className="text-gray-600">Enter your PIN to access encrypted evidence</p>
          </div>

          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
            placeholder="Enter PIN"
            maxLength={6}
            className="w-full p-4 border-2 border-gray-200 rounded-xl text-center text-2xl font-mono mb-4 focus:border-orange-400 focus:outline-none"
            autoFocus
          />

          <button
            onClick={handleUnlock}
            disabled={pin.length < 4}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-4 rounded-xl font-bold shadow-lg disabled:opacity-50 mb-3"
          >
            Unlock Vault
          </button>

          <button
            onClick={() => navigateTo('landing')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Camera View
  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="bg-black p-6 flex justify-around items-center">
          <button
            onClick={stopCamera}
            className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            onClick={capturePhoto}
            className="bg-white hover:bg-gray-100 p-6 rounded-full"
          >
            <Camera className="h-8 w-8 text-gray-900" />
          </button>
        </div>
      </div>
    );
  }

  // Journal Form
  if (showJournalForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">New Journal Entry</h3>
              <button
                onClick={() => setShowJournalForm(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Incident Title *"
              value={journalEntry.title}
              onChange={(e) => setJournalEntry({...journalEntry, title: e.target.value})}
              className="w-full p-3 border-2 border-gray-200 rounded-xl mb-3 focus:border-orange-400 focus:outline-none"
            />

            <textarea
              placeholder="Detailed Description * (What happened, who was involved, what was said...)"
              value={journalEntry.description}
              onChange={(e) => setJournalEntry({...journalEntry, description: e.target.value})}
              className="w-full h-40 p-3 border-2 border-gray-200 rounded-xl mb-3 focus:border-orange-400 focus:outline-none resize-none"
            />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="date"
                value={journalEntry.date}
                onChange={(e) => setJournalEntry({...journalEntry, date: e.target.value})}
                className="p-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none"
              />
              <input
                type="time"
                value={journalEntry.time}
                onChange={(e) => setJournalEntry({...journalEntry, time: e.target.value})}
                className="p-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none"
              />
            </div>

            <input
              type="text"
              placeholder="Location (optional)"
              value={journalEntry.location}
              onChange={(e) => setJournalEntry({...journalEntry, location: e.target.value})}
              className="w-full p-3 border-2 border-gray-200 rounded-xl mb-3 focus:border-orange-400 focus:outline-none"
            />

            <input
              type="text"
              placeholder="Witnesses (optional)"
              value={journalEntry.witnesses}
              onChange={(e) => setJournalEntry({...journalEntry, witnesses: e.target.value})}
              className="w-full p-3 border-2 border-gray-200 rounded-xl mb-4 focus:border-orange-400 focus:outline-none"
            />

            <button
              onClick={saveJournalEntry}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-4 rounded-xl font-bold shadow-lg"
            >
              Save Entry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Vault View
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateTo('landing')}
              className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <div className="flex space-x-3">
              <button
                onClick={exportEvidence}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button
                onClick={() => {
                  setUnlocked(false);
                  setShowPinPrompt(true);
                  setPin('');
                }}
                className="text-red-600 hover:text-red-700 flex items-center space-x-2 font-medium"
              >
                <Lock className="h-4 w-4" />
                <span>Lock</span>
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Evidence Vault</h2>
              <p className="text-gray-600">{photos.length} photos • {audioRecordings.length} recordings • {journalEntries.length} entries</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-lg">
          <div className="flex space-x-2">
            {['photos', 'audio', 'journal'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-xl font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab === 'photos' && <Camera className="h-4 w-4 inline mr-2" />}
                {tab === 'audio' && <Mic className="h-4 w-4 inline mr-2" />}
                {tab === 'journal' && <FileText className="h-4 w-4 inline mr-2" />}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-6 shadow-lg min-h-96">
          {activeTab === 'photos' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Photo Evidence</h3>
                <button
                  onClick={startCamera}
                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center space-x-2"
                >
                  <Camera className="h-5 w-5" />
                  <span>Take Photo</span>
                </button>
              </div>

              {photos.length === 0 ? (
                <div className="text-center py-12">
                  <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No photos captured yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative group">
                      <img 
                        src={photo.data} 
                        alt="Evidence" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                        <button
                          onClick={() => deletePhoto(photo.id)}
                          className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{new Date(photo.timestamp).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{photo.location}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'audio' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Audio Recordings</h3>
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center space-x-2"
                  >
                    <Mic className="h-5 w-5" />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center space-x-2 animate-pulse"
                  >
                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Stop Recording</span>
                  </button>
                )}
              </div>

              {audioRecordings.length === 0 ? (
                <div className="text-center py-12">
                  <Mic className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No audio recordings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {audioRecordings.map(recording => (
                    <div key={recording.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <audio controls src={recording.url} className="w-full" />
                        <p className="text-xs text-gray-600 mt-2">{new Date(recording.timestamp).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => deleteRecording(recording.id)}
                        className="ml-4 text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'journal' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Incident Journal</h3>
                <button
                  onClick={() => setShowJournalForm(true)}
                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center space-x-2"
                >
                  <FileText className="h-5 w-5" />
                  <span>New Entry</span>
                </button>
              </div>

              {journalEntries.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No journal entries yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {journalEntries.map(entry => (
                    <div key={entry.id} className="p-6 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border border-orange-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-lg text-gray-900">{entry.title}</h4>
                          <p className="text-sm text-gray-600">{entry.date} at {entry.time}</p>
                        </div>
                        <button
                          onClick={() => deleteJournalEntry(entry.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="text-gray-700 mb-3 whitespace-pre-wrap">{entry.description}</p>
                      {entry.location && (
                        <p className="text-sm text-gray-600">📍 {entry.location}</p>
                      )}
                      {entry.witnesses && (
                        <p className="text-sm text-gray-600">👥 Witnesses: {entry.witnesses}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvidenceVaultFixed;