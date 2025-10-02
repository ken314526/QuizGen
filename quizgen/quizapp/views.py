from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from .models import MyUser


def home(request):
    return render(request, 'home.html')


def login(request):
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")

        if not email or not password:
            messages.error(request, "All fields are required.")

        user = authenticate(request, username=email, password=password)

        if user is not None:
            auth_login(request, user)
            return redirect('home')
        else:
            error = "Invalid email or password."
            return render(request, 'login.html', {'error': error})

    return render(request, 'login.html')


def signup(request):
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        password2 = request.POST.get("password2")

        if not username or not email or not password or not password2:
            error = "All fields are required."
            return render(request, 'signup.html', {'error': error})
        elif password != password2:
            error = "Passwords do not match."
            return render(request, 'signup.html', {'error': error})
        elif MyUser.objects.filter(email=email).exists():
            error = "Email is already registered."
            return render(request, 'signup.html', {'error': error})
        else:
            user = MyUser.objects.create_user(username=username, email=email, password=password)
            messages.success(request, "User created successfully. Please log in.")
            return redirect("login")

    return render(request, "signup.html")


def profile(request):
    if not request.user.is_authenticated:
        return redirect('login')
    
    user = request.user

    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        avatar = request.FILES.get("avatar")

        user = MyUser.objects.update_user(
            user,
            username=username,
            email=email,
            password=password,
            avatar=avatar
        )

        messages.success(request, "Profile updated successfully.")
        return redirect('profile')

    context = {
        'username': user.username,
        'email': user.email,
        'avatar_url': user.avatar.url if user.avatar else 'avatars/default.svg',
    }
    
    return render(request, 'profile.html', context)


def logout(request):
    auth_logout(request)
    return redirect('login')
