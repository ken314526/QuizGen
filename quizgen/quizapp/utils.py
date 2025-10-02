from django.contrib.auth import get_user_model


def get_admin_user():
    try:
        User = get_user_model()
        return User.objects.filter(is_superuser=True).first().pk
    except Exception as ex:
        return None