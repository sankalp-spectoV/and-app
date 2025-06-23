import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../../store';

const PaymentWebViewScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { courseId } = route.params as { courseId: number };
  
  const { user } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // In a real app, this would be your web payment URL
  const paymentUrl = `https://your-web-app.com/payment/${courseId}?mobile=true&userId=${user?.id}&email=${user?.email}`;

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    
    // Handle payment success/failure based on URL
    if (navState.url.includes('payment-success')) {
      Alert.alert(
        'Payment Successful',
        'Your enrollment request has been submitted and is under review.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else if (navState.url.includes('payment-failed')) {
      Alert.alert(
        'Payment Failed',
        'There was an issue processing your payment. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => webViewRef.current?.reload(),
          },
          {
            text: 'Cancel',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleGoBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      navigation.goBack();
    }
  };

  const injectedJavaScript = `
    // Pass mobile context to web
    window.isMobileApp = true;
    window.mobileUserId = '${user?.id}';
    window.mobileUserEmail = '${user?.email}';
    
    // Handle mobile-specific styling
    const style = document.createElement('style');
    style.textContent = \`
      body { 
        font-size: 16px !important; 
        -webkit-text-size-adjust: 100% !important;
      }
      .mobile-hidden { display: none !important; }
      .mobile-optimized { 
        padding: 10px !important;
        margin: 5px !important;
      }
    \`;
    document.head.appendChild(style);
    
    true; // Required for injected JavaScript
  `;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Enrollment</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* WebView */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={styles.webView}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          injectedJavaScript={injectedJavaScript}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            Alert.alert(
              'Loading Error',
              'Failed to load payment page. Please check your internet connection.',
              [
                {
                  text: 'Retry',
                  onPress: () => webViewRef.current?.reload(),
                },
                {
                  text: 'Cancel',
                  onPress: () => navigation.goBack(),
                  style: 'cancel',
                },
              ]
            );
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('HTTP Error:', nativeEvent.statusCode);
          }}
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.loadingText}>Loading payment page...</Text>
          </View>
        )}
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={16} color="#10b981" />
          <Text style={styles.securityText}>Secure payment powered by SSL encryption</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default PaymentWebViewScreen;