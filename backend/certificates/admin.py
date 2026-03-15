from django.contrib import admin
from .models import Certificate, RecalibrationEnquiry, OTPToken


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['certificate_number', 'calibration_date', 'calibration_due_date', 'is_expired', 'created_at']
    list_filter = ['calibration_due_date']
    search_fields = ['certificate_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(RecalibrationEnquiry)
class RecalibrationEnquiryAdmin(admin.ModelAdmin):
    list_display = ['certificate', 'customer_name', 'customer_email', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['customer_name', 'customer_email', 'certificate__certificate_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(OTPToken)
class OTPTokenAdmin(admin.ModelAdmin):
    list_display = ['email', 'otp', 'expires_at', 'is_used', 'created_at']
    list_filter = ['is_used']
