from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

# Custom user model extending Django default user
class User(AbstractUser):

    # make email unique for login
    email = models.EmailField(unique=True)

    # optional profile fields for future use
    full_name = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)  # auto timestamp

    def __str__(self):
        return self.email