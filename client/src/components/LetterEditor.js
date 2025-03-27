import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  ContentCopy as CopyIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLetter, createLetter, updateLetter, uploadToDrive } from '../services/api';
import DriveManager from './DriveManager';

const LetterEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { isAuthenticated } = useAuth();
  const [showDriveManager, setShowDriveManager] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLetter(id);
    }
  }, [id]);

  const fetchLetter = async (letterId) => {
    try {
      setError('');
      const response = await getLetter(letterId);
      if (response.data.letter) {
        setTitle(response.data.letter.title);
        setContent(response.data.letter.content);
      }
    } catch (err) {
      console.error('Error fetching letter:', err);
      setError('Failed to load letter');
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      setError('Please log in to save');
      return;
    }

    if (!title.trim()) {
      setError('Please add a title');
      return;
    }

    if (!content.trim()) {
      setError('Please add some content');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        title: title.trim(),
        content: content.trim()
      };

      let response;
      if (id) {
        response = await updateLetter(id, payload);
        setSuccess('Letter updated successfully');

        // If this letter was previously saved to Drive, update it there too
        const driveFileId = localStorage.getItem(`letter_${id}_drive_id`);
        if (driveFileId) {
          try {
            await uploadToDrive({
              ...payload,
              fileId: driveFileId,
              letterId: id
            });
            toast.success('Updated in Google Drive');
          } catch (driveErr) {
            console.error('Failed to update Drive file:', driveErr);
            toast.warning('Saved locally but failed to update in Drive');
          }
        }
      } else {
        response = await createLetter(payload);
        setSuccess('Letter created successfully');
        navigate(`/letters/${response.data.letter.id}`);
      }

      toast.success(success);
    } catch (err) {
      console.error('Error saving letter:', err);
      const errorMessage = err.response?.data?.message || 'Failed to save letter';
      setError(errorMessage);
      toast.error(errorMessage);

      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToDrive = async () => {
    if (!isAuthenticated) {
      setError('Please log in to save to Google Drive');
      return;
    }

    if (!title.trim()) {
      setError('Please add a title');
      return;
    }

    if (!content.trim()) {
      setError('Please add some content');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // First save locally if this is a new letter
      let localLetterId = id;
      if (!id) {
        const saveResponse = await createLetter({
          title: title.trim(),
          content: content.trim()
        });
        localLetterId = saveResponse.data.letter.id;
        navigate(`/letters/${localLetterId}`);
      }

      // Then upload to Drive with progress tracking
      const uploadResponse = await uploadToDrive({
        title: title.trim(),
        content: content.trim(),
        letterId: localLetterId,
        onProgress: (progress) => {
          // You can add a progress bar state here if needed
          console.log('Upload progress:', progress);
        }
      });

      // Cache the Drive file ID for future updates
      if (uploadResponse.data.fileId) {
        localStorage.setItem(`letter_${localLetterId}_drive_id`, uploadResponse.data.fileId);
      }
      
      setSuccess('Saved to Google Drive successfully');
      toast.success('Saved to Google Drive');

      // Update the letter with the Drive file ID
      if (localLetterId) {
        await updateLetter(localLetterId, {
          driveFileId: uploadResponse.data.fileId
        });
      }
    } catch (err) {
      console.error('Error saving to Google Drive:', err);
      const errorMessage = err.response?.data?.message || 'Failed to save to Google Drive';
      setError(errorMessage);
      toast.error(errorMessage);

      if (err.response?.status === 401) {
        // Token expired or invalid
        toast.error('Please log in again to access Google Drive');
        navigate('/login');
      } else if (err.response?.status === 403) {
        // No Drive permissions
        toast.error('Please grant Google Drive permissions');
        window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(content);
    toast.success('Content copied to clipboard');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          {id ? 'Edit Letter' : 'New Letter'}
        </Typography>
        <Box>
          <Tooltip title="Copy to clipboard">
            <IconButton onClick={handleCopyToClipboard} sx={{ mr: 1 }}>
              <CopyIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save to Google Drive">
            <IconButton 
              onClick={handleSaveToDrive} 
              sx={{ mr: 1 }}
              disabled={uploading}
            >
              {uploading ? <CircularProgress size={24} /> : <UploadIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
        error={!title.trim() && error === 'Please add a title'}
        helperText={!title.trim() && error === 'Please add a title' ? 'Title is required' : ''}
      />

      <Box sx={{ flexGrow: 1, mb: 2 }}>
        <ReactQuill
          value={content}
          onChange={setContent}
          style={{ height: 'calc(100% - 42px)' }}
          modules={{
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['link', 'clean'],
            ],
          }}
        />
      </Box>

      {showDriveManager && (
        <DriveManager onClose={() => setShowDriveManager(false)} />
      )}
    </Box>
  );
};

export default LetterEditor; 