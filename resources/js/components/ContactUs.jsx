import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import axios from 'axios';
import { useToast } from './Toast';
import { useTranslation } from '../utils/translation';

export default function ContactUs() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    captcha_answer: '',
  });
  const [captcha, setCaptcha] = useState({ question: '', answer: 0 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCaptcha();
  }, []);

  const loadCaptcha = async () => {
    try {
      const res = await axios.get('/api/contact/captcha');
      setCaptcha(res.data);
    } catch (e) {
      console.error('Failed to load CAPTCHA:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message || !formData.captcha_answer) {
      showToast('Please fill all fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/contact', {
        ...formData,
        captcha_question: captcha.question,
      });
      showToast(t('contact.successMessage'), 'success');
      setFormData({ name: '', email: '', message: '', captcha_answer: '' });
      loadCaptcha(); // Load new CAPTCHA
    } catch (e) {
      if (e.response?.data?.error) {
        showToast(e.response.data.error, 'error');
      } else {
        showToast('Failed to send message. Please try again.', 'error');
      }
      loadCaptcha(); // Load new CAPTCHA on error too
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-[hsl(var(--foreground))] animate-fade-in">{t('contact.title')}</h1>

        <Card className="animate-fade-in shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">{t('contact.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t('contact.name')}</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">{t('contact.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="message">{t('contact.message')}</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={6}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="captcha">{t('contact.humanVerification')}</Label>
                <div className="mt-1 space-y-2">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {t('contact.captchaQuestion')} {captcha.question}
                  </p>
                  <Input
                    id="captcha"
                    type="number"
                    value={formData.captcha_answer}
                    onChange={(e) => setFormData({ ...formData, captcha_answer: e.target.value })}
                    placeholder={t('contact.captchaPlaceholder')}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? t('common.loading') : t('contact.sendMessage')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

