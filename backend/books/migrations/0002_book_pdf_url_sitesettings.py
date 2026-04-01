from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='book',
            name='pdf_url',
            field=models.TextField(blank=True, null=True, verbose_name='PDF URL (tashqi)'),
        ),
        migrations.CreateModel(
            name='SiteSettings',
            fields=[
                ('key', models.CharField(max_length=200, primary_key=True, serialize=False, verbose_name='Kalit')),
                ('value', models.TextField(verbose_name='Qiymat')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Yangilangan')),
            ],
            options={
                'verbose_name': 'Sayt sozlamasi',
                'verbose_name_plural': 'Sayt sozlamalari',
            },
        ),
    ]
