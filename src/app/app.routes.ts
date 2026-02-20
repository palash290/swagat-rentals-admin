import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
      {
            path: '',
            loadComponent: () => import('./components/log-in/log-in.component').then(m => m.LogInComponent)
      },
      {
            path: 'forgot-password',
            loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
            path: 'verify-otp',
            loadComponent: () => import('./components/verify-otp/verify-otp.component').then(m => m.VerifyOtpComponent)
      },
      {
            path: 'reset-password',
            loadComponent: () => import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      },
      {
            path: 'home',
            loadComponent: () => import('./components/main/main.component').then(m => m.MainComponent),
            canActivate: [authGuard],
            children: [
                  {
                        path: 'dashboard',
                        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
                  },

                  {
                        path: 'client-list',
                        loadComponent: () => import('./components/client-list/client-list.component').then(m => m.ClientListComponent)
                  },
                  {
                        path: 'view-client',
                        loadComponent: () => import('./components/client-list/view-client/view-client.component').then(m => m.ViewClientComponent)
                  },
                  {
                        path: 'client-devices',
                        loadComponent: () => import('./components/client-list/client-devices/client-devices.component').then(m => m.ClientDevicesComponent)
                  },

                  {
                        path: 'inatalled-devices',
                        loadComponent: () => import('./components/inatalled-devices/inatalled-devices.component').then(m => m.InatalledDevicesComponent)
                  },
                  {
                        path: 'view-devices',
                        loadComponent: () => import('./components/inatalled-devices/view-devices/view-devices.component').then(m => m.ViewDevicesComponent)
                  },

                  {
                        path: 'assets',
                        loadComponent: () => import('./components/assets/assets.component').then(m => m.AssetsComponent)
                  },
                  {
                        path: 'view-assets',
                        loadComponent: () => import('./components/assets/view-assets/view-assets.component').then(m => m.ViewAssetsComponent)
                  },

                  {
                        path: 'employees',
                        loadComponent: () => import('./components/employees/employees.component').then(m => m.EmployeesComponent)
                  },
                  {
                        path: 'view-employees',
                        loadComponent: () => import('./components/employees/view-employees/view-employees.component').then(m => m.ViewEmployeesComponent)
                  },
                  {
                        path: 'my-profile',
                        loadComponent: () => import('./components/my-profile/my-profile.component').then(m => m.MyProfileComponent)
                  },
                  {
                        path: 'change-password',
                        loadComponent: () => import('./components/change-password/change-password.component').then(m => m.ChangePasswordComponent)
                  },
            ]
      }
];
