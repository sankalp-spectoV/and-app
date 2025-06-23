import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../../store';
import { fetchCourseModules, checkCourseAccess } from '../../store/slices/coursesSlice';
import { CoursesService } from '../../services/courses';

const CourseDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  
  const { courseId } = route.params as { courseId: number };
  const { user } = useSelector((state: RootState) => state.auth);
  const { modules, isLoading } = useSelector((state: RootState) => state.courses);
  
  const [hasAccess, setHasAccess] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(-1); // -1: not enrolled, 0: pending, 1: approved
  const [courseDetails, setCourseDetails] = useState<any>(null);

  useEffect(() => {
    loadCourseData();
  }, [courseId, user?.email]);

  const loadCourseData = async () => {
    if (!user?.email) return;

    try {
      // Check course access
      const accessResult = await dispatch(checkCourseAccess({ 
        email: user.email, 
        courseId 
      }) as any);
      
      if (checkCourseAccess.fulfilled.match(accessResult)) {
        setHasAccess(accessResult.payload.hasAccess);
      }

      // Check enrollment status
      const statusResult = await CoursesService.checkEnrollmentStatus(user.email, courseId);
      setEnrollmentStatus(statusResult.value);

      // Load modules if user has access
      if (accessResult.payload?.hasAccess) {
        dispatch(fetchCourseModules({ courseId, userId: user.id }) as any);
      }

    } catch (error) {
      console.error('Error loading course data:', error);
    }
  };

  const handleEnrollment = () => {
    if (enrollmentStatus === 0) {
      Alert.alert('Enrollment Pending', 'Your enrollment request is under review.');
      return;
    }

    if (enrollmentStatus === 1) {
      Alert.alert('Already Enrolled', 'You are already enrolled in this course.');
      return;
    }

    // Navigate to payment
    navigation.navigate('PaymentWebView' as never, { courseId } as never);
  };

  const handleModulePress = (module: any) => {
    if (!hasAccess) {
      Alert.alert('Access Denied', 'Please enroll in the course to access this content.');
      return;
    }

    navigation.navigate('VideoPlayer' as never, { 
      moduleId: module.id,
      courseId: courseId,
      moduleTitle: module.title 
    } as never);
  };

  const renderModule = (module: any, index: number) => (
    <TouchableOpacity
      key={module.id}
      style={styles.moduleItem}
      onPress={() => handleModulePress(module)}
    >
      <View style={styles.moduleLeft}>
        <View style={[
          styles.moduleNumber,
          module.completed && styles.moduleNumberCompleted
        ]}>
          {module.completed ? (
            <Ionicons name="checkmark" size={16} color="#fff" />
          ) : (
            <Text style={styles.moduleNumberText}>{index + 1}</Text>
          )}
        </View>
        <View style={styles.moduleInfo}>
          <Text style={styles.moduleTitle}>{module.title}</Text>
          <Text style={styles.moduleDay}>Day {module.day}</Text>
          {module.progress > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${module.progress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(module.progress)}%</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.moduleRight}>
        {hasAccess ? (
          <Ionicons name="play-circle" size={24} color="#8b5cf6" />
        ) : (
          <Ionicons name="lock-closed" size={24} color="#d1d5db" />
        )}
      </View>
    </TouchableOpacity>
  );

  const getEnrollmentButtonText = () => {
    switch (enrollmentStatus) {
      case 0: return 'Enrollment Pending';
      case 1: return 'Already Enrolled';
      default: return 'Enroll Now';
    }
  };

  const getEnrollmentButtonStyle = () => {
    switch (enrollmentStatus) {
      case 0: return [styles.enrollButton, styles.enrollButtonPending];
      case 1: return [styles.enrollButton, styles.enrollButtonEnrolled];
      default: return styles.enrollButton;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Course Header */}
        <View style={styles.courseHeader}>
          <Image
            source={{ uri: courseDetails?.thumbnail || 'https://via.placeholder.com/400x200' }}
            style={styles.courseImage}
          />
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle}>
              {courseDetails?.title || 'Course Title'}
            </Text>
            <Text style={styles.courseDescription}>
              {courseDetails?.description || 'Course description will be loaded here.'}
            </Text>
            <View style={styles.courseStats}>
              <View style={styles.statItem}>
                <Ionicons name="play-circle" size={16} color="#6b7280" />
                <Text style={styles.statText}>{modules.length} modules</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={16} color="#6b7280" />
                <Text style={styles.statText}>Self-paced</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Enrollment Button */}
        {!hasAccess && (
          <View style={styles.enrollmentSection}>
            <TouchableOpacity
              style={getEnrollmentButtonStyle()}
              onPress={handleEnrollment}
              disabled={enrollmentStatus !== -1}
            >
              <Text style={styles.enrollButtonText}>
                {getEnrollmentButtonText()}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Course Modules */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>Course Content</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
          ) : modules.length > 0 ? (
            modules.map((module, index) => renderModule(module, index))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>No modules available</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  courseHeader: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  courseImage: {
    width: '100%',
    height: 200,
  },
  courseInfo: {
    padding: 20,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  courseStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
  },
  enrollmentSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  enrollButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  enrollButtonPending: {
    backgroundColor: '#f59e0b',
  },
  enrollButtonEnrolled: {
    backgroundColor: '#10b981',
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modulesSection: {
    backgroundColor: '#fff',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  moduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moduleNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  moduleNumberCompleted: {
    backgroundColor: '#10b981',
  },
  moduleNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  moduleDay: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  moduleRight: {
    marginLeft: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
});

export default CourseDetailScreen;