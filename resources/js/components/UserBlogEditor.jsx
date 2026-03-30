import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { blogAPI, blogUserAPI } from '../utils/api';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

export default function UserBlogEditor() {
  const { id } = useParams();
  const isEdit = useMemo(() => Boolean(id), [id]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    blog_category_id: '',
    tag_ids: [],
    featured_image: null,
  });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [catRes, tagRes] = await Promise.all([blogAPI.categories(), blogAPI.tags()]);
        setCategories(catRes.data || []);
        setTags(tagRes.data || []);
        if (isEdit) {
          const { data } = await blogUserAPI.get(id);
          setForm({
            title: data.title || '',
            excerpt: data.excerpt || '',
            content: data.content || '',
            blog_category_id: data.blog_category_id || '',
            tag_ids: (data.tags || []).map(t => t.id),
            featured_image: null,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEdit]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onTagToggle = (tagId) => {
    setForm(prev => {
      const set = new Set(prev.tag_ids);
      if (set.has(tagId)) set.delete(tagId); else set.add(tagId);
      return { ...prev, tag_ids: Array.from(set) };
    });
  };

  const onFileChange = (e) => {
    setForm(prev => ({ ...prev, featured_image: e.target.files?.[0] || null }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('title', form.title);
      if (form.excerpt) payload.append('excerpt', form.excerpt);
      payload.append('content', form.content);
      if (form.blog_category_id) payload.append('blog_category_id', form.blog_category_id);
      form.tag_ids.forEach(id => payload.append('tag_ids[]', id));
      if (form.featured_image) payload.append('featured_image', form.featured_image);
      if (isEdit) {
        await blogUserAPI.update(id, payload);
      } else {
        await blogUserAPI.create(payload);
      }
      navigate('/my-blog');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">{isEdit ? 'Edit Post' : 'Create Post'}</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Excerpt</label>
          <textarea
            name="excerpt"
            value={form.excerpt}
            onChange={onChange}
            className="border rounded px-3 py-2 w-full"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Content</label>
          <textarea
            name="content"
            value={form.content}
            onChange={onChange}
            className="border rounded px-3 py-2 w-full"
            rows={10}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Category</label>
          <select
            name="blog_category_id"
            value={form.blog_category_id || ''}
            onChange={onChange}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="">— None —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => {
              const active = form.tag_ids.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTagToggle(t.id)}
                  className={`px-3 py-1 rounded border ${active ? 'bg-[hsl(var(--primary))] text-white' : 'bg-transparent'}`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Featured Image</label>
          <input type="file" accept="image/*" onChange={onFileChange} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save (Submit for Review)'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/my-blog')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

