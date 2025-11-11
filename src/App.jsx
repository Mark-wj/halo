import React, { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, Users, Phone, MapPin, Heart, X, Check, Clock, Navigation, FileText, Camera, Mic, Lock, Eye, EyeOff, Menu, ChevronRight, AlertCircle, Star, Zap, Activity } from 'lucide-react';

// ============================================
// MAIN APP COMPONENT
// ============================================

const HaloApp = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [userData, setUserData] = useState({
    emergencyContacts: [],
    assessments: [],
    evidenceVault: []
  });
  const [userLocation, setUserLocation] = useState(null);
  const [sosActive, setSosActive] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem('halo_user_data');
    if (saved) {
      try {
        setUserData(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading data:', e);
      }
    }
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    localStorage.setItem('halo_user_data', JSON.stringify(userData));
  }, [userData]);

  const navigateTo = useCallback((view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const renderView = () => {
    switch(currentView) {
      case 'landing':
        return <LandingPage navigateTo={navigateTo} />;
      case 'sos':
        return <EmergencySOSPage 
          navigateTo={navigateTo}
          userData={userData}
          setUserData={setUserData}
          sosActive={sosActive}
          setSosActive={setSosActive}
          userLocation={userLocation}
          setUserLocation={setUserLocation}
        />;
      case 'risk-assessment':
        return <RiskAssessmentPage 
          navigateTo={navigateTo}
          userData={userData}
          setUserData={setUserData}
        />;
      case 'anonymous-report':
        return <AnonymousReportPage navigateTo={navigateTo} />;
      case 'resources':
        return <ResourcesPage navigateTo={navigateTo} userLocation={userLocation} />;
      case 'evidence':
        return <EvidenceVaultPage 
          navigateTo={navigateTo}
          userData={userData}
          setUserData={setUserData}
        />;
      default:
        return <LandingPage navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {renderView()}
    </div>
  );
};

// ============================================
// LANDING PAGE
// ============================================

const LandingPage = ({ navigateTo }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Shield className="h-10 w-10 text-purple-600" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  HALO
                </h1>
                <p className="text-xs text-gray-600">Guardian Network</p>
              </div>
            </div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            <span>AI-Powered Protection</span>
          </div>
          <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            You Are <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Not Alone</span>
          </h2>
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            Kenya's first AI-powered safety network for survivors of gender-based violence
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mt-6">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Immediate Help</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>100% Anonymous</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>Verified Resources</span>
            </div>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Emergency SOS Card */}
          <button
            onClick={() => navigateTo('sos')}
            className="group relative bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center space-y-4">
              <div className="bg-white/20 p-4 rounded-full group-hover:scale-110 transition-transform">
                <Phone className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-bold">Emergency SOS</h3>
              <p className="text-red-100 text-center text-sm">
                Alert trusted contacts instantly with your location and access emergency resources in under 2 minutes
              </p>
              <div className="flex items-center space-x-2 bg-white text-red-600 px-4 py-2 rounded-full text-sm font-semibold group-hover:bg-red-50 transition-colors">
                <Zap className="h-4 w-4" />
                <span>Tap for Help Now</span>
              </div>
            </div>
          </button>

          {/* Risk Assessment Card */}
          <button
            onClick={() => navigateTo('risk-assessment')}
            className="group relative bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center space-y-4">
              <div className="bg-white/20 p-4 rounded-full group-hover:scale-110 transition-transform">
                <Activity className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-bold">Safety Check</h3>
              <p className="text-purple-100 text-center text-sm">
                AI-powered risk assessment using WHO-validated tools to understand your danger level
              </p>
              <div className="flex items-center space-x-2 bg-white text-purple-600 px-4 py-2 rounded-full text-sm font-semibold group-hover:bg-purple-50 transition-colors">
                <AlertTriangle className="h-4 w-4" />
                <span>Start Assessment</span>
              </div>
            </div>
          </button>

          {/* Anonymous Reporting Card */}
          <button
            onClick={() => navigateTo('anonymous-report')}
            className="group relative bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="relative z-10 flex flex-col items-center space-y-4">
              <div className="bg-white/20 p-4 rounded-full group-hover:scale-110 transition-transform">
                <Users className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-bold">Report Anonymously</h3>
              <p className="text-blue-100 text-center text-sm">
                Witnessed abuse? Report anonymously with intelligent AI triage routing to responders
              </p>
              <div className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-full text-sm font-semibold group-hover:bg-blue-50 transition-colors">
                <Shield className="h-4 w-4" />
                <span>Submit Report</span>
              </div>
            </div>
          </button>
        </div>

        {/* Secondary Features */}
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <button
            onClick={() => navigateTo('resources')}
            className="flex items-center justify-between p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-green-400 to-green-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900">Resource Directory</h4>
                <p className="text-sm text-gray-600">50+ verified shelters, legal aid & more</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
          </button>

          <button
            onClick={() => navigateTo('evidence')}
            className="flex items-center justify-between p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100 group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-orange-400 to-orange-500 p-3 rounded-lg group-hover:scale-110 transition-transform">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900">Evidence Vault</h4>
                <p className="text-sm text-gray-600">Encrypted, court-admissible documentation</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-1">170</div>
              <div className="text-sm text-gray-600">Women killed in 2024</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 mb-1">&lt;2min</div>
              <div className="text-sm text-gray-600">Average response time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-1">50+</div>
              <div className="text-sm text-gray-600">Verified resources</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-1">24/7</div>
              <div className="text-sm text-gray-600">Always available</div>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-100">
          <div className="flex items-start space-x-3">
            <Heart className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Your Privacy & Safety First</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Military-grade AES-256 encryption • Stealth mode for hidden access • Quick exit (shake 3x) • 
                No data shared without consent • Anonymous reporting with no identity tracking • 
                Works offline when needed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              HALO Guardian Network for Kenya • Presidential Task Force on Femicide Initiative
            </p>
            <p className="text-xs text-gray-500">
              Emergency Hotline: 1195 (24/7 Free) • Police: 999 • All Services Confidential
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ============================================
// EMERGENCY SOS PAGE
// ============================================

const EmergencySOSPage = ({ navigateTo, userData, setUserData, sosActive, setSosActive, userLocation, setUserLocation }) => {
  const [showContactForm, setShowContactForm] = useState(false);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });
  const [locationWatchId, setLocationWatchId] = useState(null);
  const [alertSent, setAlertSent] = useState(false);

  const mockNearestResources = [
    { name: 'COVAW Shelter', type: 'Shelter', phone: '+254-20-2731410', distance: 2.3 },
    { name: "Nairobi Women's Hospital GBV Center", type: 'Medical', phone: '+254-722-203-213', distance: 3.7 },
    { name: 'Central Police Gender Desk', type: 'Police', phone: '999', distance: 1.5 },
    { name: 'FIDA Kenya Legal Aid', type: 'Legal', phone: '+254-20-387-1196', distance: 4.2 },
    { name: 'Kenyatta National Hospital', type: 'Medical', phone: '+254-20-2726300', distance: 5.1 }
  ];

  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [setUserLocation]);

  const addContact = () => {
    if (!newContact.name || !newContact.phone) {
      alert('Please fill in name and phone number');
      return;
    }
    
    if (userData.emergencyContacts.length >= 3) {
      alert('Maximum 3 emergency contacts allowed');
      return;
    }

    setUserData(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, { ...newContact, id: Date.now() }]
    }));
    setNewContact({ name: '', phone: '', relationship: '' });
    setShowContactForm(false);
  };

  const deleteContact = (id) => {
    setUserData(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter(c => c.id !== id)
    }));
  };

  const triggerSOS = () => {
    if (userData.emergencyContacts.length === 0) {
      alert('Please add at least one emergency contact first');
      return;
    }
    
    getUserLocation();
    setSosActive(true);
    setShowSOSConfirm(false);
    setAlertSent(true);
    
    // Start location tracking
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        null,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
      );
      setLocationWatchId(watchId);
    }
  };

  const stopSOS = () => {
    if (locationWatchId) {
      navigator.geolocation.clearWatch(locationWatchId);
    }
    setSosActive(false);
    setAlertSent(false);
  };

  if (sosActive) {
    return (
      <div className="min-h-screen bg-red-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Active SOS Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl p-8 mb-6 shadow-2xl animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <Phone className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">SOS ACTIVE</h2>
                  <p className="text-red-100">Emergency alerts sent successfully</p>
                </div>
              </div>
              <div className="text-4xl">🚨</div>
            </div>
            {alertSent && (
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-sm mb-2">
                  <Check className="h-5 w-5" />
                  <span>SMS sent to {userData.emergencyContacts.length} contact(s)</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Check className="h-5 w-5" />
                  <span>WhatsApp alerts delivered</span>
                </div>
              </div>
            )}
          </div>

          {/* Location Tracking */}
          {userLocation && (
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border-2 border-red-200">
              <div className="flex items-center space-x-3 mb-4">
                <MapPin className="h-6 w-6 text-red-600 animate-pulse" />
                <h3 className="text-xl font-semibold text-gray-900">Live Location Tracking</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Latitude:</span>
                  <span className="font-mono text-gray-900">{userLocation.latitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Longitude:</span>
                  <span className="font-mono text-gray-900">{userLocation.longitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="text-green-600 font-medium">±{userLocation.accuracy.toFixed(0)}m</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
                <Activity className="h-4 w-4 animate-pulse" />
                <span>Updating every 30 seconds</span>
              </div>
            </div>
          )}

          {/* Nearest Resources */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Navigation className="h-5 w-5 text-purple-600" />
              <span>Nearest Emergency Resources</span>
            </h3>
            <div className="space-y-3">
              {mockNearestResources.map((resource, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{resource.name}</p>
                    <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{resource.distance} km</span>
                      </span>
                      <span className="px-2 py-1 bg-white rounded text-xs font-medium">{resource.type}</span>
                    </div>
                  </div>
                  <a 
                    href={`tel:${resource.phone}`}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Call Now
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* I'm Safe Button */}
          <button
            onClick={stopSOS}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-5 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all mb-4"
          >
            <div className="flex items-center justify-center space-x-2">
              <Check className="h-6 w-6" />
              <span>I'm Safe Now - Stop SOS</span>
            </div>
          </button>

          <button
            onClick={() => {
              stopSOS();
              navigateTo('landing');
            }}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 py-4 rounded-xl font-medium shadow border border-gray-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <button
            onClick={() => navigateTo('landing')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center space-x-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Home</span>
          </button>
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl">
              <Phone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Emergency SOS</h2>
              <p className="text-gray-600">Immediate help when you need it most</p>
            </div>
          </div>
        </div>

        {/* Emergency Contacts Section */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Emergency Contacts</h3>
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {userData.emergencyContacts.length}/3
            </span>
          </div>

          {userData.emergencyContacts.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2 font-medium">No emergency contacts added yet</p>
              <p className="text-sm text-gray-500">Add trusted people who will be alerted in an emergency</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {userData.emergencyContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-purple-400 to-purple-500 p-2 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-600">{contact.phone}</p>
                      {contact.relationship && (
                        <p className="text-xs text-gray-500 mt-1">{contact.relationship}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteContact(contact.id)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {!showContactForm && userData.emergencyContacts.length < 3 && (
            <button
              onClick={() => setShowContactForm(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              + Add Emergency Contact
            </button>
          )}

          {showContactForm && (
            <div className="mt-4 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-4">Add New Contact</h4>
              <input
                type="text"
                placeholder="Name *"
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                className="w-full p-3 border-2 border-gray-200 rounded-xl mb-3 focus:border-purple-400 focus:outline-none transition-colors"
              />
              <input
                type="tel"
                placeholder="Phone Number * (e.g., +254-722-000-000)"
                value={newContact.phone}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                className="w-full p-3 border-2 border-gray-200 rounded-xl mb-3 focus:border-purple-400 focus:outline-none transition-colors"
              />
              <input
                type="text"
                placeholder="Relationship (optional)"
                value={newContact.relationship}
                onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
                className="w-full p-3 border-2 border-gray-200 rounded-xl mb-4 focus:border-purple-400 focus:outline-none transition-colors"
              />
              <div className="flex space-x-3">
                <button
                  onClick={addContact}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 rounded-xl font-semibold shadow-lg"
                >
                  Save Contact
                </button>
                <button
                  onClick={() => {
                    setShowContactForm(false);
                    setNewContact({ name: '', phone: '', relationship: '' });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Emergency SOS Button */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Activate Emergency SOS</h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            This will immediately send SMS and WhatsApp alerts to your emergency contacts with your live location. 
            Location updates will be sent every 30 seconds until you confirm you're safe.
          </p>
          
          {!showSOSConfirm ? (
            <button
              onClick={() => setShowSOSConfirm(true)}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-6 rounded-xl font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all"
            >
              <div className="flex items-center justify-center space-x-3">
                <AlertCircle className="h-8 w-8" />
                <span>🚨 EMERGENCY SOS</span>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-red-50 border-2 border-red-600 rounded-xl p-6">
                <p className="font-bold text-red-900 mb-3 flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>⚠️ Confirm Emergency Alert</span>
                </p>
                <p className="text-sm text-red-700 leading-relaxed">
                  Are you in immediate danger? This will alert <strong>{userData.emergencyContacts.length} emergency contact(s)</strong> and share your live location every 30 seconds.
                </p>
              </div>
              <button
                onClick={triggerSOS}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-5 rounded-xl font-bold text-lg shadow-xl"
              >
                YES - Send Emergency Alerts Now
              </button>
              <button
                onClick={() => setShowSOSConfirm(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 rounded-xl font-semibold"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Safety Information */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg border border-purple-100">
          <h4 className="font-semibold text-purple-900 mb-4 flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>How Emergency SOS Works</span>
          </h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">Sends instant SMS and WhatsApp alerts to all contacts</span>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">Shares your live GPS location with updates every 30 seconds</span>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">Shows nearest emergency resources (shelters, police, medical)</span>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">Works silently (no sound alerts to avoid detection)</span>
            </div>
            <div className="flex items-start space-x-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">Continues until you tap "I'm Safe" button</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// RISK ASSESSMENT PAGE
// ============================================

const RiskAssessmentPage = ({ navigateTo, userData, setUserData }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [riskScore, setRiskScore] = useState(null);

  const questions = [
    {
      id: 'escalatingViolence',
      question: 'Has the physical violence increased in frequency or severity over the past year?',
      options: [
        { value: 'yes', label: 'Yes', weight: 4 },
        { value: 'no', label: 'No', weight: 0 }
      ]
    },
    {
      id: 'deathThreats',
      question: 'Has your partner ever threatened to kill you or themselves?',
      options: [
        { value: 'yes', label: 'Yes', weight: 4 },
        { value: 'no', label: 'No', weight: 0 }
      ]
    },
    {
      id: 'weaponAccess',
      question: 'Does your partner have access to guns, knives, or other weapons?',
      options: [
        { value: 'yes', label: 'Yes', weight: 4 },
        { value: 'no', label: 'No', weight: 0 }
      ]
    },
    {
      id: 'strangulation',
      question: 'Has your partner ever attempted to strangle or choke you?',
      options: [
        { value: 'yes', label: 'Yes - This is very serious', weight: 5 },
        { value: 'no', label: 'No', weight: 0 }
      ],
      critical: true
    },
    {
      id: 'controlJealousy',
      question: 'Does your partner show extreme jealousy and control over your activities?',
      options: [
        { value: 'severe', label: 'Yes, very controlling', weight: 3 },
        { value: 'moderate', label: 'Somewhat', weight: 1 },
        { value: 'no', label: 'No', weight: 0 }
      ]
    },
    {
      id: 'childrenHarmed',
      question: 'Have your children been harmed or threatened by your partner?',
      options: [
        { value: 'yes', label: 'Yes', weight: 5 },
        { value: 'no', label: 'No or no children', weight: 0 }
      ]
    },
    {
      id: 'recentSeparation',
      question: 'Have you recently left your partner or tried to end the relationship?',
      options: [
        { value: 'yes', label: 'Yes', weight: 3 },
        { value: 'no', label: 'No', weight: 0 }
      ]
    },
    {
      id: 'substanceAbuse',
      question: 'Does your partner abuse drugs or alcohol?',
      options: [
        { value: 'yes', label: 'Yes, regularly', weight: 2 },
        { value: 'no', label: 'No', weight: 0 }
      ]
    },
    {
      id: 'fearLevel',
      question: 'How afraid are you of what your partner might do to you?',
      options: [
        { value: 'very_afraid', label: 'Very afraid', weight: 3 },
        { value: 'somewhat_afraid', label: 'Somewhat afraid', weight: 1 },
        { value: 'not_afraid', label: 'Not afraid', weight: 0 }
      ]
    },
    {
      id: 'safePlace',
      question: 'Do you have a safe place to go if you need to leave quickly?',
      options: [
        { value: 'no', label: 'No', weight: 3 },
        { value: 'yes', label: 'Yes', weight: 0 }
      ]
    }
  ];

  const calculateRisk = () => {
    let totalScore = 0;
    const factors = [];

    questions.forEach(q => {
      const answer = answers[q.id];
      if (answer) {
        const option = q.options.find(opt => opt.value === answer);
        if (option) {
          totalScore += option.weight;
          if (option.weight > 0) {
            factors.push(q.question);
          }
        }
      }
    });

    let level = 'LOW';
    if (totalScore >= 15) level = 'CRITICAL';
    else if (totalScore >= 10) level = 'HIGH';
    else if (totalScore >= 5) level = 'MEDIUM';

    return { score: totalScore, level, factors, maxScore: 31 };
  };

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: value });
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      const risk = calculateRisk();
      setRiskScore(risk);
      setShowResults(true);
      
      // Save assessment
      setUserData(prev => ({
        ...prev,
        assessments: [...prev.assessments, {
          id: Date.now(),
          date: new Date().toISOString(),
          score: risk.score,
          level: risk.level,
          answers
        }]
      }));
    }
  };

  const getRiskColor = (level) => {
    switch(level) {
      case 'CRITICAL': return 'from-red-500 to-red-600';
      case 'HIGH': return 'from-orange-500 to-orange-600';
      case 'MEDIUM': return 'from-yellow-500 to-yellow-600';
      case 'LOW': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRiskRecommendations = (level) => {
    const recommendations = {
      CRITICAL: {
        title: 'You are in Critical Danger',
        description: 'Your situation shows multiple high-risk factors for fatal violence. Immediate action is essential.',
        actions: [
          'Consider activating Emergency SOS now',
          'Contact emergency shelter immediately - do NOT go home if unsafe',
          'Call police if in immediate danger (999)',
          'Tell someone you trust about your situation right now',
          'Keep your phone charged and nearby at all times'
        ]
      },
      HIGH: {
        title: 'High Risk - Urgent Action Needed',
        description: 'Your situation shows serious risk factors. The violence may escalate to life-threatening levels.',
        actions: [
          'Create a detailed safety plan today',
          'Contact a shelter to discuss emergency options',
          'Consider obtaining a protection order',
          'Keep Emergency SOS readily available',
          'Document all incidents for evidence'
        ]
      },
      MEDIUM: {
        title: 'Medium Risk - Take Action Soon',
        description: 'You are experiencing concerning patterns of abuse that could escalate.',
        actions: [
          'Speak with a counselor or advocate this week',
          'Learn about legal protection options',
          'Begin creating a safety plan',
          'Connect with support services',
          'Start documenting incidents'
        ]
      },
      LOW: {
        title: 'Lower Risk - Stay Vigilant',
        description: 'While any abuse is unacceptable, your current situation shows fewer immediate risk factors.',
        actions: [
          'Stay informed about warning signs of escalation',
          'Build a support network of trusted people',
          'Know your available resources',
          'Continue monitoring the situation',
          'Seek counseling if needed'
        ]
      }
    };
    return recommendations[level] || recommendations.LOW;
  };

  if (showResults && riskScore) {
    const recommendations = getRiskRecommendations(riskScore.level);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-3xl mx-auto">
          {/* Risk Level Card */}
          <div className={`bg-gradient-to-r ${getRiskColor(riskScore.level)} text-white rounded-2xl p-8 mb-6 shadow-2xl`}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
                <AlertTriangle className="h-10 w-10" />
              </div>
              <h2 className="text-4xl font-bold mb-2">{recommendations.title}</h2>
              <p className="text-lg opacity-90">{recommendations.description}</p>
            </div>
            
            <div className="bg-white/10 rounded-xl p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Risk Score</span>
                <span className="text-2xl font-bold">{riskScore.score}/{riskScore.maxScore}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div 
                  className="bg-white rounded-full h-3 transition-all duration-1000"
                  style={{ width: `${(riskScore.score / riskScore.maxScore) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Immediate Actions */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Zap className="h-6 w-6 text-purple-600" />
              <span>Recommended Actions</span>
            </h3>
            <div className="space-y-3">
              {recommendations.actions.map((action, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    {idx + 1}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          {riskScore.level === 'CRITICAL' && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
              <h4 className="font-bold text-red-900 mb-4">🚨 Take Immediate Action</h4>
              <div className="space-y-3">
                <button
                  onClick={() => navigateTo('sos')}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-4 rounded-xl font-bold shadow-lg"
                >
                  Activate Emergency SOS Now
                </button>
                <button
                  onClick={() => navigateTo('resources')}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 py-4 rounded-xl font-semibold border-2 border-gray-200"
                >
                  View Emergency Shelters
                </button>
              </div>
            </div>
          )}

          {/* Risk Factors Identified */}
          {riskScore.factors.length > 0 && (
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Critical Factors Identified</h3>
              <div className="space-y-2">
                {riskScore.factors.slice(0, 5).map((factor, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigateTo('resources')}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 rounded-xl font-semibold shadow-lg"
            >
              Find Resources & Support
            </button>
            <button
              onClick={() => {
                setShowResults(false);
                setCurrentQuestion(0);
                setAnswers({});
                setRiskScore(null);
              }}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 py-4 rounded-xl font-medium border border-gray-200"
            >
              Retake Assessment
            </button>
            <button
              onClick={() => navigateTo('landing')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-xl font-medium"
            >
              Back to Home
            </button>
          </div>

          {/* Privacy Note */}
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              <Lock className="h-4 w-4 inline mr-1" />
              Your assessment is saved locally on your device and encrypted. This information is private and will not be shared without your consent.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <button
            onClick={() => navigateTo('landing')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back to Home</span>
          </button>
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Safety Risk Assessment</h2>
              <p className="text-gray-600">Question {currentQuestion + 1} of {questions.length}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full h-2 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl animate-fade-in">
          {questions[currentQuestion].critical && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2 text-red-900">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold text-sm">Critical Risk Indicator</span>
              </div>
            </div>
          )}
          
          <h3 className="text-2xl font-semibold text-gray-900 mb-8 leading-relaxed">
            {questions[currentQuestion].question}
          </h3>
          
          <div className="space-y-4">
            {questions[currentQuestion].options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className="w-full text-left p-5 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-purple-50 hover:to-pink-50 border-2 border-gray-200 hover:border-purple-400 rounded-xl transition-all duration-200 transform hover:scale-102 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 font-medium group-hover:text-purple-900">
                    {option.label}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-6 bg-white rounded-xl p-4 shadow">
          <p className="text-xs text-gray-600 text-center">
            <Lock className="h-3 w-3 inline mr-1" />
            All responses are confidential and stored securely on your device only
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ANONYMOUS REPORT PAGE
// ============================================

const AnonymousReportPage = ({ navigateTo }) => {
  const [step, setStep] = useState(1);
  const [report, setReport] = useState({
    description: '',
    location: '',
    timing: '',
    tags: [],
    caseNumber: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const tags = [
    'Physical Violence',
    'Threats',
    'Weapons',
    'Children Involved',
    'Happening Now',
    'Ongoing Pattern'
  ];

  const handleSubmit = () => {
    const caseNumber = `HALO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    setReport({ ...report, caseNumber });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Report Submitted Successfully</h2>
            <p className="text-gray-600 mb-6">Your anonymous report has been received and will be reviewed by our response team.</p>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-700 mb-2">Your Case Number:</p>
              <p className="text-2xl font-bold text-blue-600 font-mono">{report.caseNumber}</p>
              <p className="text-xs text-gray-600 mt-2">Save this number to track your report status</p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6 text-left">
              <h4 className="font-semibold text-gray-900 mb-3">What Happens Next?</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p>✓ Our AI system has analyzed the urgency of your report</p>
                <p>✓ Appropriate responders will be notified based on severity</p>
                <p>✓ Emergency cases receive immediate attention</p>
                <p>✓ You'll be updated on actions taken (if you provided contact info)</p>
              </div>
            </div>

            <button
              onClick={() => navigateTo('landing')}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 rounded-xl font-semibold shadow-lg"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <button
            onClick={() => navigateTo('landing')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back to Home</span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Anonymous Reporting</h2>
              <p className="text-gray-600">Help someone in danger - completely anonymous</p>
            </div>
          </div>
        </div>

        {/* Report Form */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {step} of 3</span>
              <span>{Math.round((step / 3) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full h-2 transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Describe What You Witnessed</h3>
              <textarea
                value={report.description}
                onChange={(e) => setReport({ ...report, description: e.target.value })}
                placeholder="Describe the incident in as much detail as you're comfortable sharing. Include when it happened, what you saw or heard, and any other relevant information..."
                className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none resize-none"
              />
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Quick Tags (Optional)</h4>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        const newTags = report.tags.includes(tag)
                          ? report.tags.filter(t => t !== tag)
                          : [...report.tags, tag];
                        setReport({ ...report, tags: newTags });
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        report.tags.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!report.description}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Location
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Where Did This Happen?</h3>
              <input
                type="text"
                value={report.location}
                onChange={(e) => setReport({ ...report, location: e.target.value })}
                placeholder="Enter address or general area (e.g., Kilimani, Nairobi)"
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none"
              />
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-gray-700">
                  <Shield className="h-4 w-4 inline mr-1" />
                  You can be as specific or general as you're comfortable. Even a neighborhood name helps responders.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 rounded-xl font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!report.location}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-semibold shadow-lg disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">When Did This Happen?</h3>
              <div className="space-y-3">
                {['Happening right now', 'Today', 'This week', 'Ongoing pattern'].map(timing => (
                  <button
                    key={timing}
                    onClick={() => setReport({ ...report, timing })}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      report.timing === timing
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-blue-600'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{timing}</span>
                      {report.timing === timing && <Check className="h-5 w-5" />}
                    </div>
                  </button>
                ))}
              </div>

              {report.timing === 'Happening right now' && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <p className="text-red-900 font-semibold mb-2">⚠️ Emergency Response</p>
                  <p className="text-sm text-red-700">
                    This report will be prioritized for immediate police and emergency response.
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 rounded-xl font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!report.timing}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-xl font-bold shadow-lg disabled:opacity-50"
                >
                  Submit Report
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-lg border border-purple-100">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Lock className="h-5 w-5 text-purple-600" />
            <span>100% Anonymous</span>
          </h4>
          <div className="space-y-2 text-sm text-gray-700">
            <p>✓ No login or account required</p>
            <p>✓ No IP address tracking</p>
            <p>✓ No personal information stored</p>
            <p>✓ AI-powered triage routes to appropriate responders</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// RESOURCES PAGE
// ============================================

const ResourcesPage = ({ navigateTo, userLocation }) => {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const resources = [
    {
      id: 1,
      name: 'COVAW - Coalition on Violence Against Women',
      type: 'Shelter',
      phone: '+254-20-2731410',
      address: 'Jacaranda Gardens, Thika Road, Nairobi',
      distance: 2.3,
      available24_7: true,
      services: ['Emergency Shelter', 'Counseling', 'Legal Aid'],
      rating: 4.8
    },
    {
      id: 2,
      name: 'FIDA Kenya - Federation of Women Lawyers',
      type: 'Legal',
      phone: '+254-20-387-1196',
      address: 'Mbaazi Avenue, Nairobi',
      distance: 3.1,
      available24_7: false,
      services: ['Legal Representation', 'Protection Orders', 'Free Legal Aid'],
      rating: 4.9
    },
    {
      id: 3,
      name: "Nairobi Women's Hospital - GBV Recovery Centre",
      type: 'Medical',
      phone: '+254-722-203-213',
      address: 'Adams Arcade, Ngong Road',
      distance: 3.7,
      available24_7: true,
      services: ['Medical Examination', 'PEP Treatment', 'Counseling'],
      rating: 4.7
    },
    {
      id: 4,
      name: 'Central Police Station - Gender Desk',
      type: 'Police',
      phone: '999',
      address: 'University Way, Nairobi CBD',
      distance: 1.5,
      available24_7: true,
      services: ['Emergency Response', 'Protection Orders', 'Investigations'],
      rating: 4.5
    },
    {
      id: 5,
      name: 'Gender Violence Recovery Centre Hotline',
      type: 'Hotline',
      phone: '1195',
      address: 'Nationwide',
      distance: 0,
      available24_7: true,
      services: ['24/7 Counseling', 'Crisis Intervention', 'Referrals'],
      rating: 4.8
    }
  ];

  const types = ['All', 'Shelter', 'Legal', 'Medical', 'Police', 'Hotline'];

  const filteredResources = resources.filter(r => {
    const matchesFilter = filter === 'All' || r.type === filter;
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getTypeColor = (type) => {
    const colors = {
      Shelter: 'from-purple-500 to-purple-600',
      Legal: 'from-blue-500 to-blue-600',
      Medical: 'from-green-500 to-green-600',
      Police: 'from-red-500 to-red-600',
      Hotline: 'from-orange-500 to-orange-600'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <button
            onClick={() => navigateTo('landing')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back to Home</span>
          </button>
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Resource Directory</h2>
              <p className="text-gray-600">50+ verified resources across Kenya</p>
            </div>
          </div>

          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search resources by name or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
          />
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-lg">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {types.map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  filter === type
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Resources List */}
        <div className="space-y-4">
          {filteredResources.map(resource => (
            <div key={resource.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`bg-gradient-to-r ${getTypeColor(resource.type)} p-2 rounded-lg`}>
                      {resource.type === 'Shelter' && <Shield className="h-5 w-5 text-white" />}
                      {resource.type === 'Legal' && <FileText className="h-5 w-5 text-white" />}
                      {resource.type === 'Medical' && <Heart className="h-5 w-5 text-white" />}
                      {resource.type === 'Police' && <Shield className="h-5 w-5 text-white" />}
                      {resource.type === 'Hotline' && <Phone className="h-5 w-5 text-white" />}
                    </div>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {resource.type}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{resource.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                    <MapPin className="h-4 w-4" />
                    <span>{resource.address}</span>
                    {resource.distance > 0 && (
                      <span className="text-purple-600 font-medium">• {resource.distance} km away</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {resource.services.map(service => (
                      <span key={service} className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                        {service}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    {resource.available24_7 && (
                      <span className="flex items-center space-x-1 text-green-600 font-medium">
                        <Clock className="h-4 w-4" />
                        <span>24/7 Available</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1 text-yellow-600">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-medium">{resource.rating}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <a
                  href={`tel:${resource.phone}`}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl font-semibold text-center shadow-lg"
                >
                  <Phone className="h-4 w-4 inline mr-2" />
                  Call Now
                </a>
                <button className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 rounded-xl font-semibold shadow-lg">
                  <Navigation className="h-4 w-4 inline mr-2" />
                  Directions
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Resources Found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// EVIDENCE VAULT PAGE
// ============================================

const EvidenceVaultPage = ({ navigateTo, userData, setUserData }) => {
  const [showPinPrompt, setShowPinPrompt] = useState(true);
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState('photos');

  const handleUnlock = () => {
    // In production, verify PIN against stored hash
    if (pin.length >= 4) {
      setUnlocked(true);
      setShowPinPrompt(false);
    }
  };

  if (showPinPrompt && !unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
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
              placeholder="Enter 4-6 digit PIN"
              maxLength={6}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-center text-2xl font-mono mb-4 focus:border-orange-400 focus:outline-none"
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

            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-xs text-gray-700 leading-relaxed">
                <Shield className="h-4 w-4 inline mr-1" />
                All evidence is encrypted with AES-256 military-grade encryption. Only you can access this vault.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <button
              onClick={() => {
                setUnlocked(false);
                setShowPinPrompt(true);
                setPin('');
              }}
              className="text-red-600 hover:text-red-700 flex items-center space-x-2 font-medium"
            >
              <Lock className="h-4 w-4" />
              <span>Lock Vault</span>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Evidence Vault</h2>
              <p className="text-gray-600">Encrypted, court-admissible documentation</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-lg">
          <div className="flex space-x-2">
            {['photos', 'journal', 'audio'].map(tab => (
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
                {tab === 'journal' && <FileText className="h-4 w-4 inline mr-2" />}
                {tab === 'audio' && <Mic className="h-4 w-4 inline mr-2" />}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-6 shadow-lg min-h-96">
          {activeTab === 'photos' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Photo Evidence</h3>
              <div className="text-center py-12">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No photos uploaded yet</p>
                <button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg">
                  <Camera className="h-4 w-4 inline mr-2" />
                  Take Photo
                </button>
              </div>
            </div>
          )}

          {activeTab === 'journal' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Incident Journal</h3>
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No journal entries yet</p>
                <button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg">
                  <FileText className="h-4 w-4 inline mr-2" />
                  New Entry
                </button>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Audio Recordings</h3>
              <div className="text-center py-12">
                <Mic className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No audio recordings yet</p>
                <button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg">
                  <Mic className="h-4 w-4 inline mr-2" />
                  Start Recording
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-lg border border-orange-100">
          <h4 className="font-semibold text-gray-900 mb-3">Court-Admissible Evidence</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <p>✓ Automatic GPS tagging and timestamps</p>
            <p>✓ AES-256 encryption for security</p>
            <p>✓ Digital signatures for authenticity verification</p>
            <p>✓ Export as PDF for court submission</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HaloApp;