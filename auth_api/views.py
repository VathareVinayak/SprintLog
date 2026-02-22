from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer

# Create your views here.
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):

    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        return Response({"message": "User registered successfully"}, status=201)

    return Response(serializer.errors, status=400)


#  Login view to authenticate user and return JWT tokens
@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):

    username = request.data.get("username")
    password = request.data.get("password")

    # authenticate user credentials
    user = authenticate(username=username, password=password)

    if user is None:
        return Response({"error": "Invalid credentials"}, status=401)

    # generate JWT tokens
    refresh = RefreshToken.for_user(user)

    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh)
    })

# PROTECTED TEST 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):

    # returns logged-in user info
    return Response({
        "user": request.user.username,
        "email": request.user.email
    })