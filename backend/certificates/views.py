import threading
import logging

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def send_mail_async(**kwargs):
    """Send email in a background daemon thread so API responses are instant."""
    def _send():
        try:
            send_mail(**kwargs)
        except Exception as e:
            logger.error(f"Background email failed: {e}")

    thread = threading.Thread(target=_send, daemon=True)
    thread.start()

from .models import Certificate, RecalibrationEnquiry, OTPToken
from .serializers import (
    CertificateSerializer, CertificateCheckSerializer,
    RecalibrationEnquirySerializer
)


# ─── Public: Customer Certificate Check ───────────────────────────────────────

class CertificateCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, certificate_number):
        try:
            cert = Certificate.objects.get(certificate_number=certificate_number.strip())
        except Certificate.DoesNotExist:
            return Response(
                {'found': False, 'message': 'Certificate not found. Please verify the certificate number.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CertificateCheckSerializer(cert)
        data = serializer.data
        data['found'] = True
        return Response(data, status=status.HTTP_200_OK)


# ─── Public: Recalibration Enquiry Submission ─────────────────────────────────

class RecalibrationEnquiryCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RecalibrationEnquirySerializer(data=request.data)
        if serializer.is_valid():
            enquiry = serializer.save()

            # 1. Send Professional Acknowledgement to Customer (background thread)
            send_mail_async(
                subject=f'Service Request: Recalibration for Certificate #{enquiry.certificate.certificate_number}',
                message=(
                    f"Dear {enquiry.customer_name},\n\n"
                    f"Thank you for contacting Prime Innovation regarding the recalibration of your equipment.\n\n"
                    f"We have received your request for Certificate Number: {enquiry.certificate.certificate_number}, "
                    f"which reached its calibration due date on {enquiry.certificate.calibration_due_date.strftime('%d %B %Y')}. "
                    f"Ensuring your instruments remain within compliance is our priority, and we are ready to assist with the necessary servicing.\n\n"
                    f"Thank you for choosing Prime Innovation for your compliance and calibration needs.\n\n"
                    f"Best regards,\n\n"
                    f"Compliance Team\n"
                    f"Prime Innovation"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[enquiry.customer_email],
                fail_silently=True,
            )

            # 2. Send Alert Notification to Admin (background thread)
            send_mail_async(
                subject=f'URGENT: New Recalibration Request - {enquiry.certificate.certificate_number}',
                message=(
                    f"A new recalibration enquiry has been submitted through the portal.\n\n"
                    f"CERTIFICATE DETAILS:\n"
                    f"Certificate Number: {enquiry.certificate.certificate_number}\n"
                    f"Due Date: {enquiry.certificate.calibration_due_date}\n\n"
                    f"CUSTOMER DETAILS:\n"
                    f"Name: {enquiry.customer_name}\n"
                    f"Email: {enquiry.customer_email}\n"
                    f"Phone: {enquiry.customer_phone or 'N/A'}\n\n"
                    f"MESSAGE FROM CUSTOMER:\n"
                    f"{enquiry.message or 'No message provided'}\n\n"
                    f"Please coordinate with the technical department to process this request."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.ADMIN_EMAIL],
                fail_silently=True,
            )

            return Response(
                {'success': True, 'message': 'Your recalibration request has been submitted successfully. We will contact you shortly.'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Admin Auth: Login ────────────────────────────────────────────────────────

class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_obj = User.objects.get(email=email)
            username = user_obj.username
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_staff:
            return Response({'error': 'Access denied. Admin privileges required.'}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }, status=status.HTTP_200_OK)


# ─── Admin Auth: Forgot Password (OTP Flow) ───────────────────────────────────

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email, is_staff=True)
        except User.DoesNotExist:
            # Security: don't reveal if email exists
            return Response({'message': 'If this email is registered, an OTP has been sent.'}, status=status.HTTP_200_OK)

        token = OTPToken.generate_otp(email)

        # Send OTP email in background thread
        send_mail_async(
            subject='Password Reset OTP — Prime Customer Validation',
            message=(
                f"Hello {user.first_name or user.username},\n\n"
                f"Your password reset OTP is: {token.otp}\n\n"
                f"This OTP is valid for 10 minutes. Do not share it with anyone.\n\n"
                f"If you did not request this, please ignore this email."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

        return Response({'message': 'If this email is registered, an OTP has been sent.'}, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        otp = request.data.get('otp', '').strip()

        if not email or not otp:
            return Response({'error': 'Email and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        token = OTPToken.objects.filter(email=email, otp=otp, is_used=False).order_by('-created_at').first()
        if not token or token.is_expired:
            return Response({'error': 'Invalid or expired OTP. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark OTP as consumed
        token.is_used = True
        token.save()

        return Response({'valid': True, 'message': 'OTP verified. You may now reset your password.'}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not email or not new_password:
            return Response({'error': 'Email and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'error': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email, is_staff=True)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(new_password)
        user.save()

        return Response({'success': True, 'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)


# ─── Admin: Certificate CRUD ──────────────────────────────────────────────────

class CertificateListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Certificate.objects.all()

        # Filters
        cert_status = request.query_params.get('status')  # 'valid' | 'expired'
        search = request.query_params.get('search', '').strip()
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        if search:
            queryset = queryset.filter(certificate_number__icontains=search)

        if date_from:
            queryset = queryset.filter(calibration_due_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(calibration_due_date__lte=date_to)

        serializer = CertificateSerializer(queryset, many=True)
        data = serializer.data

        # Filter by status after serialization (uses computed property)
        if cert_status == 'expired':
            data = [c for c in data if c['is_expired']]
        elif cert_status == 'valid':
            data = [c for c in data if not c['is_expired']]

        return Response({'count': len(data), 'results': data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CertificateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CertificateDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Certificate.objects.get(pk=pk)
        except Certificate.DoesNotExist:
            return None

    def get(self, request, pk):
        cert = self.get_object(pk)
        if not cert:
            return Response({'error': 'Certificate not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(CertificateSerializer(cert).data)

    def put(self, request, pk):
        cert = self.get_object(pk)
        if not cert:
            return Response({'error': 'Certificate not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CertificateSerializer(cert, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        cert = self.get_object(pk)
        if not cert:
            return Response({'error': 'Certificate not found.'}, status=status.HTTP_404_NOT_FOUND)
        cert.delete()
        return Response({'message': 'Certificate deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


# ─── Admin: Enquiries ─────────────────────────────────────────────────────────

class EnquiryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = RecalibrationEnquiry.objects.all()

        enq_status = request.query_params.get('status')  # 'pending' | 'resolved'
        search = request.query_params.get('search', '').strip()
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        if enq_status:
            queryset = queryset.filter(status=enq_status)
        if search:
            queryset = queryset.filter(
                certificate__certificate_number__icontains=search
            ) | queryset.filter(customer_name__icontains=search)
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        serializer = RecalibrationEnquirySerializer(queryset, many=True)
        return Response({'count': queryset.count(), 'results': serializer.data}, status=status.HTTP_200_OK)


class EnquiryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return RecalibrationEnquiry.objects.get(pk=pk)
        except RecalibrationEnquiry.DoesNotExist:
            return None

    def put(self, request, pk):
        enquiry = self.get_object(pk)
        if not enquiry:
            return Response({'error': 'Enquiry not found.'}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()

        # ── Handle Resolution with Details ────────────────────────────────
        new_status = request.data.get('status')
        new_due_date = request.data.get('calibration_due_date')
        new_cert_number = request.data.get('new_certificate_number')

        if new_status == 'resolved':
            if not new_due_date or not new_cert_number:
                return Response(
                    {'error': 'New certificate number and due date are required to resolve.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            from datetime import datetime
            try:
                parsed_due_date = datetime.strptime(new_due_date, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid date format. Please use YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if parsed_due_date < today:
                return Response(
                    {'error': 'The new due date must be today or a future date.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update the certificate
            certificate = enquiry.certificate
            certificate.certificate_number = new_cert_number.strip()
            certificate.calibration_due_date = parsed_due_date
            certificate.calibration_date = today  # Today is the new calibration date
            certificate.save()

            enquiry.status = 'resolved'
            enquiry.save()

            self._send_resolution_email(enquiry, parsed_due_date)
            return Response(RecalibrationEnquirySerializer(enquiry).data)

        # ── Handle Plain Status Update (e.g. Reopen) ──────────────────────
        if new_status:
            if new_status not in ['pending', 'resolved']:
                return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
            
            enquiry.status = new_status
            enquiry.save()
            return Response(RecalibrationEnquirySerializer(enquiry).data)

        return Response({'error': 'No updates provided.'}, status=status.HTTP_400_BAD_REQUEST)

    def _send_resolution_email(self, enquiry, new_due_date=None):
        """Send a professional resolution notification to the customer (background thread)."""
        cert = enquiry.certificate
        date_info = ""
        if new_due_date:
            date_info = (
                f"The calibration due date for your certificate has been updated to "
                f"{new_due_date.strftime('%d %B %Y')}. "
            )

        send_mail_async(
            subject=f'Recalibration Complete: Certificate #{cert.certificate_number}',
            message=(
                f"Dear {enquiry.customer_name},\n\n"
                f"We are pleased to inform you that your recalibration request for "
                f"Certificate Number: {cert.certificate_number} has been resolved.\n\n"
                f"{date_info}"
                f"Your equipment is now compliant and the certificate status has been updated to Active in our system.\n\n"
                f"Summary:\n"
                f"Certificate Number: {cert.certificate_number}\n"
                f"Calibration Date: {cert.calibration_date.strftime('%d %B %Y')}\n"
                f"New Due Date: {cert.calibration_due_date.strftime('%d %B %Y')}\n"
                f"Status: Active\n\n"
                f"If you have any further questions or need additional assistance, "
                f"please do not hesitate to contact us.\n\n"
                f"Thank you for choosing Prime Innovation for your calibration and compliance needs.\n\n"
                f"Best regards,\n\n"
                f"Compliance Team\n"
                f"Prime Innovation"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[enquiry.customer_email],
            fail_silently=True,
        )


# ─── Admin: Dashboard Stats ────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        today = timezone.now().date()

        total_certs = Certificate.objects.count()
        expired_certs = Certificate.objects.filter(calibration_due_date__lt=today).count()
        active_certs = total_certs - expired_certs
        pending_enquiries = RecalibrationEnquiry.objects.filter(status='pending').count()
        total_enquiries = RecalibrationEnquiry.objects.count()

        return Response({
            'total_certificates': total_certs,
            'active_certificates': active_certs,
            'expired_certificates': expired_certs,
            'total_enquiries': total_enquiries,
            'pending_enquiries': pending_enquiries,
        })
