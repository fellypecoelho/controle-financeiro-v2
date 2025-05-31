import React, { useState } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Typography, 
  Divider, 
  Avatar, 
  Menu, 
  MenuItem, 
  useMediaQuery, 
  useTheme 
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  Receipt as ReceiptIcon, 
  CreditCard as CreditCardIcon, 
  CalendarToday as CalendarIcon, 
  BarChart as ChartIcon, 
  Settings as SettingsIcon, 
  AccountBalance as AccountBalanceIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Despesas', icon: <ReceiptIcon />, path: '/despesas' },
  { text: 'Aportes', icon: <AccountBalanceIcon />, path: '/aportes' },
  { text: 'Cartões', icon: <CreditCardIcon />, path: '/cartoes' },
  { text: 'Calendário', icon: <CalendarIcon />, path: '/calendario' },
  { text: 'Relatórios', icon: <ChartIcon />, path: '/relatorios' },
  { text: 'Configurações', icon: <SettingsIcon />, path: '/configuracoes' },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleMenuClick = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };
  
  const drawer = (
    <div>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Controle Financeiro
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => handleMenuClick(item.path)}
            selected={location.pathname === item.path}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'rgba(66, 133, 244, 0.08)',
                borderRight: '3px solid',
                borderColor: 'primary.main',
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'rgba(66, 133, 244, 0.12)',
              },
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{ 
                fontWeight: location.pathname === item.path ? 500 : 400,
                color: location.pathname === item.path ? 'primary.main' : 'inherit'
              }} 
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'white',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls="profile-menu"
              aria-haspopup="true"
            >
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {user?.nome?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              id="profile-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
            >
              <MenuItem disabled>
                <Typography variant="body2">
                  {user?.nome || 'Usuário'}
                </Typography>
              </MenuItem>
              <MenuItem disabled>
                <Typography variant="body2" color="textSecondary">
                  {user?.email || 'email@exemplo.com'}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Sair" />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default'
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
