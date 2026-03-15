from django.db import models
from django.utils import timezone
import random
import string


class Certificate(models.Model):
    certificate_number = models.CharField(max_length=100, unique=True)
    calibration_date = models.DateField()
    calibration_due_date = models.DateField()
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.certificate_number

    @property
    def is_expired(self):
        return self.calibration_due_date < timezone.now().date()

    @property
    def status(self):
        return 'expired' if self.is_expired else 'valid'


class RecalibrationEnquiry(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
    ]

    certificate = models.ForeignKey(
        Certificate, on_delete=models.CASCADE, related_name='enquiries'
    )
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    message = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Enquiry for {self.certificate.certificate_number} by {self.customer_name}"


class OTPToken(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.email}"

    @classmethod
    def generate_otp(cls, email):
        # Invalidate old OTPs for this email
        cls.objects.filter(email=email, is_used=False).update(is_used=True)
        otp = ''.join(random.choices(string.digits, k=6))
        expires_at = timezone.now() + timezone.timedelta(minutes=10)
        token = cls.objects.create(email=email, otp=otp, expires_at=expires_at)
        return token

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
