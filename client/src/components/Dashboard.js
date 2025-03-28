import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Folder as FolderIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  api, 
  getLettersCount, 
  getFilesFromDrive, 
  getRecentLetters, 
  getDriveStorage 
} from '../services/api';

const StatCard = ({ title, value, icon, color, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        height: 140,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          p: 2,
          color: `${color}.main`,
          opacity: 0.2,
        }}
      >
        {icon}
      </Box>
      <Typography color="textSecondary" gutterBottom>
        {title}
      </Typography>
      {loading ? (
        <CircularProgress size={20} />
      ) : (
        <Typography variant="h4" component="div">
          {value}
        </Typography>
      )}
    </Paper>
  </motion.div>
);

const QuickActionCard = ({ title, description, icon, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mr: 2, color: 'primary.main' }}>{icon}</Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography color="textSecondary" variant="body2">
          {description}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={onClick}>
          Get Started
        </Button>
      </CardActions>
    </Card>
  </motion.div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalLetters: 0,
    driveFiles: 0,
    recentActivity: 0,
    lastUpdated: null,
    storageUsed: 0,
    storageLimit: 0
  });
  const [recentItems, setRecentItems] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch all stats in parallel for better performance
      const [lettersResponse, driveResponse, recentResponse, storageResponse] = await Promise.all([
        getLettersCount(),
        getFilesFromDrive(),
        getRecentLetters(),
        getDriveStorage()
      ]).catch(error => {
        throw new Error(`Failed to fetch data: ${error.response?.data?.message || error.message}`);
      });
      
      // Validate responses
      if (!lettersResponse?.data?.count && lettersResponse?.data?.count !== 0) {
        throw new Error('Invalid response from letters count endpoint');
      }

      if (!Array.isArray(driveResponse?.data?.files)) {
        throw new Error('Invalid response from drive files endpoint');
      }

      if (!Array.isArray(recentResponse?.data?.letters)) {
        throw new Error('Invalid response from recent letters endpoint');
      }

      if (!storageResponse?.data?.used && storageResponse?.data?.used !== 0) {
        throw new Error('Invalid response from storage endpoint');
      }
      
      setStats({
        totalLetters: lettersResponse.data.count,
        driveFiles: driveResponse.data.files.length,
        recentActivity: recentResponse.data.letters.length,
        lastUpdated: recentResponse.data.letters[0]?.updatedAt,
        storageUsed: storageResponse.data.used,
        storageLimit: storageResponse.data.limit || 1 // Prevent division by zero
      });

      // Sort recent items by date and limit to 5
      const sortedItems = recentResponse.data.letters
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5);
      
      setRecentItems(sortedItems);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.message || 'Failed to fetch dashboard data');
      
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchStats();
    
    // Set up real-time updates
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchStats]);

  const statsData = [
    {
      title: 'Total Letters',
      value: stats.totalLetters,
      icon: <EditIcon sx={{ fontSize: 60 }} />,
      color: 'primary',
    },
    {
      title: 'Drive Files',
      value: stats.driveFiles,
      icon: <FolderIcon sx={{ fontSize: 60 }} />,
      color: 'secondary',
    },
    {
      title: 'Recent Activity',
      value: stats.recentActivity,
      icon: <TrendingUpIcon sx={{ fontSize: 60 }} />,
      color: 'success',
    },
    {
      title: 'Storage Used',
      value: `${Math.round((stats.storageUsed / stats.storageLimit) * 100)}%`,
      icon: <AccessTimeIcon sx={{ fontSize: 60 }} />,
      color: 'info',
      progress: (stats.storageUsed / stats.storageLimit) * 100
    },
  ];

  const quickActions = [
    {
      title: 'Create New Letter',
      description: 'Start writing a new letter with our advanced editor',
      icon: <EditIcon />,
      onClick: () => navigate('/letters'),
    },
    {
      title: 'Browse Drive',
      description: 'Access and manage your Google Drive files',
      icon: <FolderIcon />,
      onClick: () => navigate('/drive'),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Dashboard
        </Typography>
        {error && (
          <Button 
            color="primary" 
            onClick={() => {
              setLoading(true);
              fetchStats();
              // Restart auto-refresh
              const interval = setInterval(fetchStats, 30000);
              setRefreshInterval(interval);
            }}
          >
            Retry
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsData.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <StatCard {...stat} loading={loading} />
            {stat.progress && (
              <LinearProgress 
                variant="determinate" 
                value={stat.progress} 
                sx={{ mt: 1 }}
                color={stat.progress > 90 ? 'error' : stat.progress > 70 ? 'warning' : 'primary'}
              />
            )}
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Quick Actions
      </Typography>
      
      <Grid container spacing={3}>
        {quickActions.map((action) => (
          <Grid item xs={12} md={6} key={action.title}>
            <QuickActionCard {...action} />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Recent Activity
        </Typography>
        <Paper sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : recentItems.length > 0 ? (
            recentItems.map((item, index) => (
              <Box key={item.id} sx={{ mb: index !== recentItems.length - 1 ? 2 : 0 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {item.title} - {new Date(item.updatedAt).toLocaleString()}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={100 - (index * 25)} 
                  sx={{ mb: 1 }}
                />
              </Box>
            ))
          ) : (
            <Typography color="textSecondary" align="center">
              No recent activity
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard; 