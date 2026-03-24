import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
      {
            path: '',
            loadComponent: () => import('./components/landing-page/landing-page.component').then(m => m.LandingPageComponent)
      },
      {
            path: 'login',
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
                        path: 'client-request-admin',
                        loadComponent: () => import('./components/client-request-admin/client-request-admin.component').then(m => m.ClientRequestAdminComponent)
                  },
                  {
                        path: 'view-client-request',
                        loadComponent: () => import('./components/client-request-admin/view-client-request/view-client-request.component').then(m => m.ViewClientRequestComponent)
                  },
                  {
                        path: 'client-list',
                        loadComponent: () => import('./components/client-list/client-list.component').then(m => m.ClientListComponent)
                  },
                  {
                        path: 'add-client',
                        loadComponent: () => import('./components/client-list/add-client/add-client.component').then(m => m.AddClientComponent)
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
                        path: 'assets-category',
                        loadComponent: () => import('./components/assets-category/assets-category.component').then(m => m.AssetsCategoryComponent)
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
                  {
                        path: 'service-requests',
                        loadComponent: () => import('./components/service-requests/service-requests.component').then(m => m.ServiceRequestsComponent)
                  },
                  {
                        path: 'asset-purchase',
                        loadComponent: () => import('./components/asset-purchase/asset-purchase.component').then(m => m.AssetPurchaseComponent)
                  },
                  {
                        path: 'asset-purchase',
                        loadComponent: () => import('./components/asset-purchase/asset-purchase.component').then(m => m.AssetPurchaseComponent)
                  },
                  {
                        path: 'asset-purchase-detail',
                        loadComponent: () => import('./components/asset-purchase/asset-purchase-detail/asset-purchase-detail.component').then(m => m.AssetPurchaseDetailComponent)
                  },
                  {
                        path: 'add-assets',
                        loadComponent: () => import('./components/asset-purchase/add-asset/add-asset.component').then(m => m.AddAssetComponent)
                  },
                  {
                        path: 'payments',
                        loadComponent: () => import('./components/payments/payments.component').then(m => m.PaymentsComponent)
                  },
                  {
                        path: 'payment-details',
                        loadComponent: () => import('./components/payments/payment-details/payment-details.component').then(m => m.PaymentDetailsComponent)
                  },
                  {
                        path: 'agreements',
                        loadComponent: () => import('./components/agreements/agreements.component').then(m => m.AgreementsComponent)
                  },
                  {
                        path: 'agreements-details',
                        loadComponent: () => import('./components/agreements/agreement-details/agreement-details.component').then(m => m.AgreementDetailsComponent)
                  },
                  {
                        path: 'reparing',
                        loadComponent: () => import('./components/reparing/reparing.component').then(m => m.ReparingComponent)
                  },
                  {
                        path: 'reparing-details',
                        loadComponent: () => import('./components/reparing/reparing-details/reparing-details.component').then(m => m.ReparingDetailsComponent)
                  },
                  {
                        path: 'add-reparing',
                        loadComponent: () => import('./components/reparing/add-reparing/add-reparing.component').then(m => m.AddReparingComponent)
                  },
                  {
                        path: 'support',
                        loadComponent: () => import('./components/support/support.component').then(m => m.SupportComponent)
                  },
                  {
                        path: 'warranty-tracking',
                        loadComponent: () => import('./components/warranty-tracking/warranty-tracking.component').then(m => m.WarrantyTrackingComponent)
                  }
            ]
      }
];
