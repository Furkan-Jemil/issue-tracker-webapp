import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Link, Paperclip, X } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { useAppContext } from '../context/AppContext';
import { useResponsive } from '../responsive/useResponsive';
import Grid from '../responsive/Grid';
import { Screen, Card, Input, Textarea, Select, Button } from '../components/ui';
import type { SelectOption } from '../components/ui';
import { useToast } from '../components/Toast';
import { loadToken } from '../utils/secureStore';

// File picker imports
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
// Dynamic import — won't crash Metro if expo-file-system isn't installed yet.
// expo-file-system@54+ moved the classic file API (readAsStringAsync /
// EncodingType) to the `expo-file-system/legacy` subpath; the package root now
// exposes the new File/Directory API without those functions. Prefer legacy so
// base64 reads keep working, and fall back to the root for older SDKs.
let FileSystem: { readAsStringAsync: (uri: string, opts?: any) => Promise<string>; cacheDirectory: string; EncodingType: { Base64: string } } | null = null;
try {
  FileSystem = require('expo-file-system/legacy');
} catch {
  try {
    FileSystem = require('expo-file-system');
  } catch {} // not installed — upload will show a helpful message
}
// Guard against a root import that lacks the legacy read function.
if (FileSystem && typeof FileSystem.readAsStringAsync !== 'function') {
  try {
    FileSystem = require('expo-file-system/legacy');
  } catch {}
}

type UploadedFile = {
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  type: 'screenshot' | 'attachment';
};

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'BUG', label: 'Bug' },
  { value: 'IMPROVEMENT', label: 'Improvement' },
];
const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];
const SEVERITY_OPTIONS: SelectOption[] = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'MAJOR', label: 'Major' },
  { value: 'MINOR', label: 'Minor' },
];

export default function CreateTaskScreen() {
  const { colors, spacing, typography, pagePadding } = useTheme();
  const { isTablet } = useResponsive();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { members, createIssue, updateIssue } = useAppContext();
  const { showToast } = useToast();

  const editing = (route.params as any)?.issue;
  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [type, setType] = useState(editing?.type ?? 'BUG');
  const [priority, setPriority] = useState(editing?.priority ?? 'MEDIUM');
  const [severity, setSeverity] = useState(editing?.severity ?? 'MINOR');
  const [assignee, setAssignee] = useState(editing?.assignee ?? '');
   const [url, setUrl] = useState(editing?.url ?? '');
   const [errors, setErrors] = useState<Record<string, string>>({});
   const [submitting, setSubmitting] = useState(false);
   const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(() => {
     // Pre-load existing screenshots and attachments when editing
      if (editing) {
        const screenshots = (editing.screenshots || []).map((s: any) => ({
          id: s.id,
          url: s.url,
          filename: s.filename,
          mimeType: s.mimeType,
          sizeBytes: s.sizeBytes,
          type: 'screenshot' as const
        }));
        const attachments = (editing.attachments || []).map((a: any) => ({
          id: a.id,
          url: a.url,
          filename: a.filename,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
          type: 'attachment' as const
        }));
        return [...screenshots, ...attachments];
      }
     return [];
   });
   const [uploading, setUploading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const assigneeOptions: SelectOption[] = [
    { value: '', label: 'Unassigned' },
    ...members.map((m) => ({ value: String(m.name ?? ''), label: String(m.name ?? 'Unknown') })),
  ];

   const goBack = () => navigation.goBack();

   const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

    const handleUploadFiles = () => {
      // Show options for image or document, using setTimeout to let the native Android dialog close cleanly first
      Alert.alert(
        'Add Files',
        'Choose file type:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => setTimeout(takePhoto, 150) },
          { text: 'Choose from Gallery', onPress: () => setTimeout(pickImage, 150) },
          { text: 'Choose Document', onPress: () => setTimeout(pickDocument, 150) },
        ]
      );
    };

    const takePhoto = async () => {
      let assets: any[] | null = null;
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please allow camera access to take photos.');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
          assets = result.assets;
        }
      } catch (error) {
        console.error('Camera error:', error);
        Alert.alert('Error', 'Failed to open camera or take photo.');
        return;
      }

      if (assets) {
        await uploadFilesToServer(assets);
      }
    };

    const pickImage = async () => {
      let assets: any[] | null = null;
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Please allow photo library access to choose images.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
          assets = result.assets;
        }
      } catch (error) {
        console.error('Image picker error:', error);
        Alert.alert('Error', 'Failed to open image gallery or pick images.');
        return;
      }

      if (assets) {
        await uploadFilesToServer(assets);
      }
    };

    const pickDocument = async () => {
      let assets: any[] | null = null;
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'text/*', 'image/*'],
          multiple: true,
        });

        if (!result.canceled && result.assets.length > 0) {
          assets = result.assets;
        }
      } catch (error) {
        console.error('Document picker error:', error);
        Alert.alert('Error', 'Failed to open document picker.');
        return;
      }

      if (assets) {
        await uploadFilesToServer(assets);
      }
    };

    const removeUploadedFile = (index: number) => {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadFilesToServer = async (assets: any[]) => {
      try {
        setUploading(true);
        const token = await loadToken();
        if (!token) throw new Error('Not authenticated');

        // Read each file as base64, then send as JSON — avoids React Native's
        // broken FormData entirely. If `base64` is not already attached,
        // fall back to expo-file-system/legacy which handles content:// and file:// URIs safely.
        const payloadFiles: { name: string; type: string; content: string; sizeBytes: number; kind: string }[] = [];

        for (const asset of assets) {
          if (!asset.uri && !asset.base64) continue;
          const fileName = asset.name || asset.fileName || `file_${Date.now()}.jpg`;

          // asset.type in expo-image-picker is "image" or "video", NOT a MIME type!
          // We must check asset.mimeType first, or derive from asset.type / filename extension.
          let fileType = asset.mimeType;
          if (!fileType || !fileType.includes('/')) {
            if (asset.type === 'image' || fileName.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
              if (fileName.toLowerCase().endsWith('.png')) fileType = 'image/png';
              else if (fileName.toLowerCase().endsWith('.gif')) fileType = 'image/gif';
              else if (fileName.toLowerCase().endsWith('.webp')) fileType = 'image/webp';
              else fileType = 'image/jpeg';
            } else if (asset.type === 'video' || fileName.match(/\.(mp4|mov|avi)$/i)) {
              fileType = 'video/mp4';
            } else if (fileName.toLowerCase().endsWith('.pdf')) {
              fileType = 'application/pdf';
            } else if (fileName.toLowerCase().endsWith('.txt')) {
              fileType = 'text/plain';
            } else if (fileName.toLowerCase().endsWith('.csv')) {
              fileType = 'text/csv';
            } else if (fileName.toLowerCase().endsWith('.zip')) {
              fileType = 'application/zip';
            } else if (fileName.toLowerCase().endsWith('.json')) {
              fileType = 'application/json';
            } else {
              fileType = asset.type && asset.type.includes('/') ? asset.type : 'application/octet-stream';
            }
          }

          let base64: string | undefined = asset.base64 || undefined;
          if (!base64) {
            if (!FileSystem || typeof FileSystem.readAsStringAsync !== 'function') {
              continue;
            }
            try {
              base64 = await FileSystem.readAsStringAsync(asset.uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
            } catch {
              continue;
            }
          }
          if (!base64) continue;

          const sizeBytes = asset.fileSize || asset.size || Math.ceil(base64.length * 0.75);
          const kind = fileType.startsWith('image/') ? 'screenshot' : 'attachment';

          payloadFiles.push({ name: fileName, type: fileType, content: base64, sizeBytes, kind });
        }

        if (payloadFiles.length === 0) {
          showToast({ message: 'No readable files found', type: 'error' });
          return;
        }

        const response = await fetch(`${API_BASE}/api/upload/base64`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ files: payloadFiles }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const rejectionReasons = [
            ...(errData.rejected || []).map((r: any) => `${r.filename}: ${r.reason}`),
            ...(errData.attachmentsRejected || []).map((r: any) => `${r.filename}: ${r.reason}`)
          ].join('; ');
          const errorMsg = rejectionReasons ? `${errData.error || 'Upload failed'} (${rejectionReasons})` : (errData.error || `Upload failed (${response.status})`);
          throw new Error(errorMsg);
        }

        const result = await response.json();

        const newFiles: UploadedFile[] = [
          ...(result.screenshots || []).map((f: any) => ({ ...f, type: 'screenshot' as const })),
          ...(result.attachments || []).map((f: any) => ({ ...f, type: 'attachment' as const })),
        ];

        setUploadedFiles(prev => [...prev, ...newFiles]);

        if (newFiles.length > 0) {
          showToast({ message: `${newFiles.length} file(s) uploaded`, type: 'success' });
        }
      } catch (error) {
        console.error('Upload failed:', error);
        showToast({
          message: error instanceof Error ? error.message : 'Upload failed',
          type: 'error',
        });
      } finally {
        setUploading(false);
      }
    };

  return (
    <Screen
      title={editing ? 'Edit Issue' : 'Create Issue'}
      subtitle={editing ? `Editing ${editing.title}` : 'Report a new bug or improvement'}
      onBack={goBack}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 640,
          alignSelf: 'center',
          paddingHorizontal: pagePadding,
          paddingVertical: spacing.xl,
          gap: spacing.xl,
        }}
      >
        <Input
          label="Issue Title"
          required
          placeholder="Brief, descriptive title"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />

        <Textarea
          label="Description"
          rows={5}
          placeholder="Detailed description — steps to reproduce, expected vs actual behavior."
          value={description}
          onChangeText={setDescription}
          error={errors.description}
        />

        <Grid columns={isTablet ? 4 : 2} gap={spacing.md}>
          <Select label="Type" value={type} options={TYPE_OPTIONS} onChange={setType} />
          <Select label="Priority" value={priority} options={PRIORITY_OPTIONS} onChange={setPriority} />
          <Select label="Severity" value={severity} options={SEVERITY_OPTIONS} onChange={setSeverity} />
          <Select label="Assignee" value={assignee} options={assigneeOptions} onChange={setAssignee} />
        </Grid>

        <Input
          label="Reference URL"
          placeholder="https://…"
          leftIcon={<Link size={14} color={colors.mutedForeground} />}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
        />

         <View style={{ gap: spacing.xs }}>
           <Text style={[typography.labelBadge, { color: colors.foreground }]}>Screenshots & Files</Text>
           <Card padding={0}>
             <TouchableOpacity
               activeOpacity={0.7}
               accessibilityRole="button"
               accessibilityLabel="Add file attachments"
               style={[styles.upload, { borderColor: colors.outline, paddingHorizontal: spacing.lg, gap: spacing.xs }]}
               onPress={handleUploadFiles}
               disabled={uploading}
             >
               <Paperclip size={22} color={colors.mutedForeground} />
               <Text style={[typography.bodySmBold, { color: colors.foreground }]}>
                 {uploading ? 'Uploading...' : 'Tap to add files'}
               </Text>
               <Text style={[typography.micro, { color: colors.mutedForeground }]}>
                 PNG, JPG, PDF, TXT up to 10 MB
               </Text>
             </TouchableOpacity>
             
             {/* Show uploaded files */}
             {uploadedFiles.length > 0 && (
               <View style={{ padding: spacing.md, paddingTop: 0, gap: spacing.sm }}>
                 {uploadedFiles.map((file, index) => (
                   <View key={`${file.url}-${index}`} style={[styles.uploadedFile, { backgroundColor: colors.muted, borderRadius: 8, padding: spacing.sm }]}>
                     <View style={{ flex: 1 }}>
                       <Text style={[typography.bodySm, { color: colors.foreground }]} numberOfLines={1}>
                         {file.filename}
                       </Text>
                       <Text style={[typography.micro, { color: colors.mutedForeground }]}>
                         {(file.sizeBytes / 1024).toFixed(1)} KB
                       </Text>
                     </View>
                     <TouchableOpacity 
                       onPress={() => removeUploadedFile(index)}
                       style={[styles.removeFileBtn, { backgroundColor: colors.error, borderRadius: 4, padding: 4 }]}
                     >
                       <X size={14} color="#fff" />
                     </TouchableOpacity>
                   </View>
                 ))}
               </View>
             )}
           </Card>
         </View>

        <View style={[styles.footer, { gap: spacing.md }]}>
            <Button title="Cancel" variant="outline" onPress={goBack} style={{ flex: 1 }} />
            <Button title={editing ? 'Save' : 'Create Task'} variant="default" disabled={submitting} onPress={async () => {
              if (!validate() || submitting) return;
              setSubmitting(true);
              try {
                  if (editing) {
                    const updatePayload: Record<string, any> = { title, description, type, priority, severity, assignee };
                    const newScreenshots = uploadedFiles.filter(f => f.type === 'screenshot' && !(f as any).id);
                    const newAttachments = uploadedFiles.filter(f => f.type === 'attachment' && !(f as any).id);
                    if (newScreenshots.length > 0) {
                      updatePayload.screenshots = newScreenshots.map(f => ({
                        url: f.url,
                        filename: f.filename,
                        mimeType: f.mimeType,
                        sizeBytes: f.sizeBytes
                      }));
                    }
                    if (newAttachments.length > 0) {
                      updatePayload.attachments = newAttachments.map(f => ({
                        url: f.url,
                        filename: f.filename,
                        mimeType: f.mimeType,
                        sizeBytes: f.sizeBytes
                      }));
                    }
                    await updateIssue(editing.id, updatePayload);
                  } else {
                   const assigneeId = members.find((m) => String(m.name) === assignee)?.id;
                   const payload: Record<string, any> = { title, description, type, priority, severity };
                   if (assigneeId) payload.assigneeId = String(assigneeId);
                   if (url.trim()) payload.url = url.trim();
                   
                   // Add uploaded files
                   const screenshots = uploadedFiles.filter(f => f.type === 'screenshot');
                   const attachments = uploadedFiles.filter(f => f.type === 'attachment');
                   if (screenshots.length > 0) {
                     payload.screenshots = screenshots.map(f => ({
                       url: f.url,
                       filename: f.filename,
                       mimeType: f.mimeType,
                       sizeBytes: f.sizeBytes
                     }));
                   }
                   if (attachments.length > 0) {
                     payload.attachments = attachments.map(f => ({
                       url: f.url,
                       filename: f.filename,
                       mimeType: f.mimeType,
                       sizeBytes: f.sizeBytes
                     }));
                   }
                   
                   await createIssue(payload);
                 }
                goBack();
              } catch (err) {
                showToast({ message: err instanceof Error ? err.message : 'Failed to save issue', type: 'error' });
              } finally {
                setSubmitting(false);
              }
            }} style={{ flex: 1 }} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {},
  upload: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 28,
    alignItems: 'center',
  },
  uploadTitle: { marginTop: 2 },
  uploadSub: {},
  footer: { flexDirection: 'row', paddingTop: 4 },
  uploadedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  removeFileBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
