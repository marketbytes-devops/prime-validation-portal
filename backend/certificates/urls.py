from django.urls import path
from . import views

urlpatterns = [
    # ─── Public (Customer-Facing) ─────────────────────────────────────────────
    path('check/<str:certificate_number>/', views.CertificateCheckView.as_view(), name='certificate-check'),
    path('enquiry/', views.RecalibrationEnquiryCreateView.as_view(), name='enquiry-create'),

    # ─── Auth ─────────────────────────────────────────────────────────────────
    path('auth/login/', views.AdminLoginView.as_view(), name='admin-login'),
    path('auth/forgot-password/', views.ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/verify-otp/', views.VerifyOTPView.as_view(), name='verify-otp'),
    path('auth/reset-password/', views.ResetPasswordView.as_view(), name='reset-password'),

    # ─── Admin: Certificates ──────────────────────────────────────────────────
    path('admin/certificates/', views.CertificateListCreateView.as_view(), name='admin-cert-list'),
    path('admin/certificates/<int:pk>/', views.CertificateDetailView.as_view(), name='admin-cert-detail'),

    # ─── Admin: Enquiries ─────────────────────────────────────────────────────
    path('admin/enquiries/', views.EnquiryListView.as_view(), name='admin-enquiry-list'),
    path('admin/enquiries/<int:pk>/', views.EnquiryDetailView.as_view(), name='admin-enquiry-detail'),

    # ─── Admin: Dashboard ─────────────────────────────────────────────────────
    path('admin/dashboard/', views.DashboardStatsView.as_view(), name='admin-dashboard'),
]
