from django.contrib.auth.models import BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, username, email, password):
        if not email:
            raise ValueError("Users must have an email address")
        if not password:
            raise ValueError("Users must have a password")

        user = self.model(email=self.normalize_email(email), username=username)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def update_user(self, user, username=None, email=None, password=None, avatar=None):
        if email:
            user.email = email
        if username:
            user.username = username
        if password:
            user.set_password(password)
        if avatar:
            user.avatar = avatar
        
        user.save()
        return user

    def create_superuser(self, username, email, password):
        if not password:
            raise ValueError("Superusers must have a password")

        user = self.create_user(username=username, email=email, password=password)
        user.is_admin = True
        user.is_superuser = True
        user.save(using=self._db)
        return user
