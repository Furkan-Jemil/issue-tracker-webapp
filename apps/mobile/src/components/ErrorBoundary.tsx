import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crash:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.heading}>Something went wrong</Text>
            <Text selectable style={styles.message}>
              {this.state.error.message}
            </Text>
            <Text selectable style={styles.stack}>
              {this.state.error.stack}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => this.setState({ error: null })}
            >
              <Text style={styles.buttonText}>Dismiss</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 24, paddingTop: 80 },
  heading: { fontSize: 18, fontWeight: '700', color: '#b91c1c' },
  message: { marginTop: 12, color: '#0A192F', fontFamily: 'monospace' },
  stack: { marginTop: 12, fontSize: 11, color: '#64748b', fontFamily: 'monospace' },
  button: {
    marginTop: 24,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});