from django.db import migrations


def seed_guest_user(apps, schema_editor):
    """Ensure guest user with id=1 exists (used by frontend for orders)."""
    User = apps.get_model('auth', 'User')
    if not User.objects.filter(pk=1).exists():
        # Create with explicit pk so the frontend's hardcoded user_id=1 works
        User.objects.create(
            pk=1,
            username='guest',
            email='guest@neurolib.local',
            password='guest',
            is_active=True,
            is_staff=False,
            is_superuser=False,
        )
        # Reset the sequence so next auto-id starts at 2
        db_alias = schema_editor.connection.alias
        if 'postgresql' in schema_editor.connection.settings_dict['ENGINE']:
            schema_editor.execute(
                "SELECT setval(pg_get_serial_sequence('auth_user', 'id'), GREATEST(MAX(id), 1)) FROM auth_user"
            )


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0002_book_pdf_url_sitesettings'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunPython(seed_guest_user, migrations.RunPython.noop),
    ]
