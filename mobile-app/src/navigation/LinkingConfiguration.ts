import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<any> = {
  prefixes: ['sankalpapp://'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: {
            screens: {
              HomeMain: 'home',
              CourseDetail: 'course/:id',
              VideoPlayer: 'video/:moduleId',
              PaymentWebView: 'payment/:courseId',
            },
          },
          Courses: {
            screens: {
              CoursesMain: 'courses',
              CourseDetail: 'course/:id',
              VideoPlayer: 'video/:moduleId',
            },
          },
          Profile: 'profile',
        },
      },
      Auth: {
        screens: {
          Welcome: 'welcome',
          Login: 'login',
          Register: 'register',
          VerifyOTP: 'verify/:email',
          ForgotPassword: 'forgot-password',
          ResetPassword: 'reset-password',
        },
      },
    },
  },
};