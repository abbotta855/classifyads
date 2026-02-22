import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { adminAPI } from '../utils/api';
import { useToast } from './Toast';
import { useTranslation } from '../utils/translation';

export default function AdminStaticPages() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState(null);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    is_active: true,
  });

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.get('/static-pages');
      setPages(res.data);
    } catch (e) {
      console.error('Failed to load static pages:', e);
      showToast('Failed to load static pages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content,
      is_active: page.is_active,
    });
  };

  const handleCancel = () => {
    setEditingPage(null);
    setFormData({
      slug: '',
      title: '',
      content: '',
      is_active: true,
    });
  };

  const handleSave = async () => {
    try {
      if (editingPage) {
        await adminAPI.put(`/static-pages/${editingPage.id}`, formData);
        showToast(t('admin.pageUpdated'), 'success');
      } else {
        await adminAPI.post('/static-pages', formData);
        showToast(t('admin.pageCreated'), 'success');
      }
      handleCancel();
      loadPages();
    } catch (e) {
      if (e.response?.data?.error) {
        showToast(e.response.data.error, 'error');
      } else {
        showToast('Failed to save page', 'error');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) {
      return;
    }
    try {
      await adminAPI.delete(`/static-pages/${id}`);
      showToast(t('admin.pageDeleted'), 'success');
      loadPages();
    } catch (e) {
      showToast('Failed to delete page', 'error');
    }
  };

  if (loading) {
    return <div className="p-4">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('admin.staticPages')}</h2>
        {!editingPage && (
          <Button onClick={() => setEditingPage({ id: null })}>
            {t('admin.createPage')}
          </Button>
        )}
      </div>

      {editingPage && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPage.id ? t('admin.editPage') : t('admin.createPage')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="slug">{t('admin.pageSlug')}</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., terms, faq, privacy-policy"
                disabled={!!editingPage.id}
              />
            </div>
            <div>
              <Label htmlFor="title">{t('admin.pageTitle')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="content">{t('admin.pageContent')}</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                {t('admin.htmlSupported')}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                {t('admin.isActive')}
              </Label>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSave}>{t('common.save')}</Button>
              <Button variant="outline" onClick={handleCancel}>
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {pages.map((page) => (
          <Card key={page.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{page.title}</CardTitle>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                    Slug: {page.slug} | {page.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(page)}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(page.id)}
                    className="text-red-600"
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content.substring(0, 200) + '...' }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

