import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { defineAbilitiesFor, type Role, type AuthUser } from '@workspace/shared';

type Issue = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  severity: string;
};

export default function App() {
  const [apiUrl, setApiUrl] = useState('http://10.0.2.2:3000'); // Default to Android host mapping
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [userRole, setUserRole] = useState<Role>('USER');
  const [userId, setUserId] = useState('');
  
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Create task state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'BUG' | 'IMPROVEMENT'>('BUG');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [newSeverity, setNewSeverity] = useState<'MINOR' | 'MAJOR' | 'CRITICAL'>('MAJOR');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Authenticated user payload
  const currentUser: AuthUser | null = isLoggedIn
    ? { id: userId, role: userRole }
    : null;

  // CASL abilities check
  const ability = defineAbilitiesFor(currentUser);

  // Fetch issues from server
  const fetchIssues = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/issues-mobile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setIssues(data);
    } catch (error: any) {
      console.error('Fetch issues error:', error);
      Alert.alert('Error', `Failed to load issues from server: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/login-mobile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setAuthToken(data.token);
      setUserId(data.user.id);
      setUserRole(data.user.role);
      setIsLoggedIn(true);

      // Fetch user issues
      await fetchIssues(data.token);
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Unable to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    setAuthToken('');
    setUserId('');
    setIssues([]);
    setShowCreateForm(false);
  };

  const handleCreateIssue = async () => {
    if (!ability.can('create', 'Issue')) {
      Alert.alert('Permission Denied', 'Your role does not have permission to create issues.');
      return;
    }

    if (!newTitle.trim() || !newDesc.trim()) {
      Alert.alert('Error', 'Please fill in Title and Description');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/issues-mobile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          type: newType,
          priority: newPriority,
          severity: newSeverity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create issue');
      }

      setNewTitle('');
      setNewDesc('');
      setShowCreateForm(false);
      Alert.alert('Success', 'Issue reported successfully');
      
      // Refresh issues
      await fetchIssues(authToken);
    } catch (error: any) {
      console.error('Create issue error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loginCard}>
          <Text style={styles.brandTitle}>inEthioTelecom</Text>
          <Text style={styles.brandSubtitle}>Issue Tracker Mobile</Text>

          <TextInput
            style={styles.input}
            placeholder="Server API Base URL"
            placeholderTextColor="#888"
            value={apiUrl}
            onChangeText={setApiUrl}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.loginHint}>
            Use credentials from your master seed list (e.g. 'admin@ethiotelecom.test' or 'tester1@ethiotelecom.test').
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header bar */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerUser} numberOfLines={1}>
            {email} ({userRole})
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Conditional Create Button based on CASL Permissions */}
      {ability.can('create', 'Issue') && !showCreateForm && (
        <TouchableOpacity
          style={styles.createToggleButton}
          onPress={() => setShowCreateForm(true)}
        >
          <Text style={styles.createToggleButtonText}>+ New Issue</Text>
        </TouchableOpacity>
      )}

      {/* Create form */}
      {showCreateForm && (
        <View style={styles.createForm}>
          <Text style={styles.formTitle}>Report New Issue</Text>
          <TextInput
            style={styles.input}
            placeholder="Issue Title"
            placeholderTextColor="#888"
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TextInput
            style={[styles.input, { height: 60 }]}
            placeholder="Description..."
            placeholderTextColor="#888"
            value={newDesc}
            onChangeText={setNewDesc}
            multiline
          />
          
          {/* Quick Selectors for Type */}
          <View style={styles.selectorRow}>
            <TouchableOpacity 
              style={[styles.selectorBtn, newType === 'BUG' && styles.selectorActive]}
              onPress={() => setNewType('BUG')}
            >
              <Text style={styles.selectorText}>BUG</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.selectorBtn, newType === 'IMPROVEMENT' && styles.selectorActive]}
              onPress={() => setNewType('IMPROVEMENT')}
            >
              <Text style={styles.selectorText}>IMPROVEMENT</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.formButton, { backgroundColor: '#444' }]}
              onPress={() => setShowCreateForm(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formButton, { backgroundColor: '#6366f1' }]}
              onPress={handleCreateIssue}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Loading indicator */}
      {isLoading && <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#6366f1" />}

      {/* Task List */}
      <FlatList
        data={issues}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshing={isLoading}
        onRefresh={() => fetchIssues(authToken)}
        renderItem={({ item }) => (
          <View style={styles.issueCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.issueTitle}>{item.title}</Text>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        item.priority === 'HIGH' ? '#ef4444' : '#f59e0b',
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>{item.priority}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: '#3b82f6' }]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.issueDesc}>{item.description}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  loginCard: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginHint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerUser: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 2,
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  createToggleButton: {
    backgroundColor: '#6366f1',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createToggleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createForm: {
    backgroundColor: '#0f172a',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  selectorRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  selectorBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectorActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  selectorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  formButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  issueCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 10,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginLeft: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  issueDesc: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
});
