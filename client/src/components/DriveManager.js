import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Paper,
  CircularProgress,
  Pagination,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  OpenInNew as OpenInNewIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';

const DriveManager = ({ onFileSelect }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const fetchFiles = async (pageNumber = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/drive/files', {
        params: {
          pageSize: 10,
          pageToken: pageNumber === 1 ? null : files[files.length - 1]?.id
        }
      });

      const { files: newFiles, nextPageToken, totalItems } = response.data;
      
      setFiles(newFiles || []);
      setTotalPages(Math.ceil((totalItems || 0) / 10));
      
      // Store the next page token for pagination
      if (nextPageToken) {
        localStorage.setItem('driveNextPageToken', nextPageToken);
      } else {
        localStorage.removeItem('driveNextPageToken');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch files');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(page);
  }, [page]);

  const handleFileClick = async (file) => {
    try {
      setLoading(true);
      setError(null);
      
      // First check if we have the content cached
      const cachedContent = localStorage.getItem(`file_${file.id}`);
      if (cachedContent) {
        setSelectedFile(file);
        setFileContent(cachedContent);
        setIsEditing(false);
        setOpenDialog(true);
        setLoading(false);
        return;
      }

      const response = await api.get(`/api/drive/files/${file.id}`);
      
      // Cache the content for future use
      localStorage.setItem(`file_${file.id}`, response.data.content);
      
      setSelectedFile(file);
      setFileContent(response.data.content);
      setIsEditing(false);
      setOpenDialog(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load file content');
      console.error('Error loading file:', err);
      toast.error('Failed to load file content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!fileContent.trim()) {
        setError('Please add some content');
        return;
      }

      const title = selectedFile ? selectedFile.name : 'New Document';
      const response = await api.post('/api/drive/upload', {
        title,
        content: fileContent,
        fileId: selectedFile?.id // Include file ID for updates
      });

      // Update cache with new content
      if (response.data.file?.id) {
        localStorage.setItem(`file_${response.data.file.id}`, fileContent);
      }

      setIsEditing(false);
      setOpenDialog(false);
      fetchFiles(page); // Refresh the file list
      toast.success(selectedFile ? 'File updated successfully' : 'File created successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save file');
      console.error('Error saving file:', err);
      toast.error('Failed to save file');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        setLoading(true);
        setError(null);
        await api.delete(`/api/drive/files/${fileId}`);
        
        // Remove from cache
        localStorage.removeItem(`file_${fileId}`);
        
        // Refresh the current page
        fetchFiles(page);
        toast.success('File deleted successfully');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete file');
        console.error('Error deleting file:', err);
        toast.error('Failed to delete file');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenInDrive = (webViewLink) => {
    window.open(webViewLink, '_blank');
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">My Documents</Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => {
            setSelectedFile(null);
            setFileContent('');
            setIsEditing(true);
            setOpenDialog(true);
          }}
        >
          New Document
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && files.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No documents found. Click "New Document" to create one.
          </Typography>
        </Paper>
      )}

      {!loading && files.length > 0 && (
        <Paper sx={{ mb: 2 }}>
          <List>
            {files.map((file) => (
              <ListItem
                key={file.id}
                button
                onClick={() => handleFileClick(file)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemText
                  primary={file.name}
                  secondary={new Date(file.modifiedTime).toLocaleString()}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenInDrive(file.webViewLink);
                    }}
                    sx={{ mr: 1 }}
                  >
                    <OpenInNewIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
        />
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedFile ? selectedFile.name : 'New Document'}
        </DialogTitle>
        <DialogContent>
          <TextField
            multiline
            fullWidth
            rows={20}
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            disabled={!isEditing}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          {isEditing ? (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => setIsEditing(true)}
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriveManager; 