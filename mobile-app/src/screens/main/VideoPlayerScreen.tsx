import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../../store';
import { generateVideoToken, updateVideoProgress } from '../../store/slices/videoSlice';
import { addToSyncQueue } from '../../store/slices/syncSlice';

const { width, height } = Dimensions.get('window');

const VideoPlayerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  
  const { moduleId, courseId, moduleTitle } = route.params as {
    moduleId: number;
    courseId: number;
    moduleTitle: string;
  };
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentVideoToken, isLoading } = useSelector((state: RootState) => state.video);
  const { isOnline } = useSelector((state: RootState) => state.sync);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    loadVideo();
  }, [moduleId, user?.email]);

  const loadVideo = async () => {
    if (!user?.email) {
      setError('User not authenticated');
      return;
    }

    try {
      const result = await dispatch(generateVideoToken({
        email: user.email,
        moduleId
      }) as any);

      if (generateVideoToken.fulfilled.match(result)) {
        const token = result.payload.token;
        const url = `http://localhost:5000/api/secure-video/${moduleId}?token=${token}`;
        setVideoUrl(url);
      } else {
        setError('Failed to load video');
      }
    } catch (error) {
      console.error('Video loading error:', error);
      setError('Failed to load video');
    }
  };

  const handleVideoProgress = (currentTime: number, duration: number) => {
    const progressData = {
      moduleId,
      courseId,
      watchedDuration: currentTime,
      totalDuration: duration,
      currentPosition: currentTime,
    };

    if (isOnline) {
      dispatch(updateVideoProgress(progressData) as any);
    } else {
      // Add to sync queue for offline mode
      dispatch(addToSyncQueue({
        action: 'video_progress',
        data: progressData,
      }));
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'progress':
          handleVideoProgress(data.currentTime, data.duration);
          break;
        case 'error':
          setError(data.message);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('WebView message error:', error);
    }
  };

  const handleRetry = () => {
    setError(null);
    loadVideo();
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Video Unavailable</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || !videoUrl) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {moduleTitle}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: videoUrl }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          allowsFullscreenVideo={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setError(`WebView error: ${nativeEvent.description}`);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setError(`HTTP error: ${nativeEvent.statusCode}`);
          }}
        />
      </View>

      {/* Controls Info */}
      <View style={styles.controlsInfo}>
        <Text style={styles.controlsText}>
          Use the video controls to play, pause, and seek through the content
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  controlsInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  controlsText: {
    fontSize: 12,
    color: '#d1d5db',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  backButtonText: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VideoPlayerScreen;