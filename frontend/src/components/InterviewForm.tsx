import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import api from '../lib/api';

export default function InterviewForm() {
  const [fio, setFio] = useState('');
  const [role, setRole] = useState('');
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  };

  const submit = async () => {
    try {
      let uploadedPath: string | null = null;
      if (audioUrl) {
        const resp = await fetch(audioUrl);
        const blob = await resp.blob();
        const fileName = `${crypto.randomUUID()}.webm`;
        const path = `audio/${fileName}`;
        const { error } = await supabase.storage.from('audit-files').upload(path, blob, {
          contentType: 'audio/webm',
          upsert: false,
        });
        if (error) throw error;
        uploadedPath = path;
      }

      const content = { fio, role, transcript };
      await api.post('/api/events', {
        day_id: 1, // TODO: привязка к конкретному дню (UI добавим позже)
        type: 'interview',
        author_id: null,
        content,
        file_urls: uploadedPath ? [uploadedPath] : [],
      });
      alert('Интервью сохранено');
      setFio('');
      setRole('');
      setTranscript('');
      setAudioUrl(null);
    } catch (e: any) {
      alert(e?.message || 'Ошибка сохранения');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Провести интервью</h2>
      <div className="grid gap-2 max-w-xl">
        <input className="border rounded p-2" placeholder="ФИО" value={fio} onChange={(e) => setFio(e.target.value)} />
        <input className="border rounded p-2" placeholder="Роль" value={role} onChange={(e) => setRole(e.target.value)} />
        <textarea className="border rounded p-2" placeholder="Расшифровка" rows={6} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        {!recording && <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={startRecording}>Записать аудио</button>}
        {recording && <button className="bg-red-600 text-white px-3 py-2 rounded" onClick={stopRecording}>Стоп</button>}
        {audioUrl && <audio src={audioUrl} controls className="ml-4" />}
      </div>
      <div>
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={submit}>Сохранить интервью</button>
      </div>
      <p className="text-sm text-gray-500">Примечание: загрузка в Supabase Storage требует, чтобы bucket "audit-files" позволял запись для аутентифицированных пользователей.</p>
    </div>
  );
}
