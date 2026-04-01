from rest_framework import serializers
from .models import Certificate, RecalibrationEnquiry
from django.contrib.auth.models import User


class CertificateSerializer(serializers.ModelSerializer):
    is_expired = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            'id', 'certificate_number', 'client_name', 'calibration_date',
            'calibration_due_date', 'description',
            'is_expired', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_is_expired(self, obj):
        return obj.is_expired

    def get_status(self, obj):
        return obj.status


class CertificateCheckSerializer(serializers.ModelSerializer):
    """Read-only serializer for customer-facing certificate check."""
    is_expired = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            'id', 'certificate_number', 'client_name', 'calibration_date',
            'calibration_due_date', 'description',
            'is_expired', 'status'
        ]

    def get_is_expired(self, obj):
        return obj.is_expired

    def get_status(self, obj):
        return obj.status


class RecalibrationEnquirySerializer(serializers.ModelSerializer):
    certificate_number = serializers.CharField(source='certificate.certificate_number', read_only=True)
    certificate_id = serializers.PrimaryKeyRelatedField(
        queryset=Certificate.objects.all(), source='certificate', write_only=True
    )

    class Meta:
        model = RecalibrationEnquiry
        fields = [
            'id', 'certificate_number', 'certificate_id',
            'customer_name', 'customer_email', 'customer_phone',
            'message', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
