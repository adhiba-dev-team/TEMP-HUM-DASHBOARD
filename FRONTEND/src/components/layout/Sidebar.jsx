import * as React from 'react';
import {
  Box,
  Drawer,
  CssBaseline,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from '@mui/material';
import {
  Menu,
  ChevronLeft,
  Dashboard,
  Thermostat,
  WaterDrop,
  Report,
  Notifications,
  Settings,
  Logout,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import WhiteLogo from '../../assets/LOGOS/whitelogo.png';

const drawerWidth = 200;

const openedMixin = theme => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = theme => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `60px`,
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const StyledDrawer = styled(Drawer)(({ theme, open, appTheme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',

  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),

  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),

  '& .MuiDrawer-paper': {
    backgroundColor: appTheme === 'dark' ? '#1A1A1A' : '#ED1C24',
    color: '#FFFFFF',
  },
}));

const menuItems = [
  { text: 'Overview', icon: <Dashboard />, path: '/Overview' },
  { text: 'List', icon: <Thermostat />, path: '/List' },
  { text: 'Device', icon: <WaterDrop />, path: '/device' },
  { text: 'Report', icon: <Report />, path: '/reports' },
  { text: 'Support', icon: <Notifications />, path: '/support' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
];

export default function Sidebar({ appTheme = 'light' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [logoutPopup, setLogoutPopup] = React.useState(false);

  const isDark = appTheme === 'dark';

  const handleDrawerToggle = () => setOpen(!open);

  const handleLogoutClick = () => setLogoutPopup(true);

  const confirmLogout = () => {
    setLogoutPopup(false);

    // CLEAR ANY LOCAL USER DATA IF ANY
    localStorage.clear();
    sessionStorage.clear();

    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' , width:"fit-content" }}>
      <CssBaseline />

      <StyledDrawer variant="permanent" open={open} appTheme={appTheme}>
        {/* LOGO */}
        <DrawerHeader>
          {open ? (
            <Box sx={{ display: 'flex', alignItems: 'center', pl: 1 }}>
              <img
                src={WhiteLogo}
                alt="Logo"
                style={{ width: '100%', height: '50px'}}
              />
            </Box>
          ) : (
            <Box sx={{ mx: 'auto' }}></Box>
          )}
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
            {open ? <ChevronLeft /> : <Menu />}
          </IconButton>
        </DrawerHeader>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

        {/* TOP MENU ITEMS */}
        <List sx={{ mt: 2, flexGrow: 1 }}>
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;

            const bg = isDark
              ? isActive
                ? '#FFFFFF'
                : 'transparent'
              : isActive
              ? '#FFC107'
              : 'transparent';

            const textColor = isDark
              ? isActive
                ? '#000000'
                : '#FFFFFF'
              : isActive
              ? '#000000'
              : '#FFFFFF';

            const hoverBg = isDark
              ? isActive
                ? '#FFFFFF'
                : 'rgba(255,255,255,0.15)'
              : isActive
              ? '#FFC107'
              : 'rgba(255,255,255,0.12)';

            return (
              <Tooltip
                key={item.text}
                title={!open ? item.text : ''}
                placement="right"
              >
                <ListItem
                  button
                  component={Link}
                  to={item.path}
                  sx={{
                    backgroundColor: bg,
                    color: textColor,
                    '&:hover': { backgroundColor: hoverBg },
                    px: open ? 1.5 : 0.5,
                    mb: 1,
                    borderRadius: '50px',
                    justifyContent: open ? 'flex-start' : 'center',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: textColor,
                      minWidth: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: open ? 1.5 : 0,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  {open && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '14px',
                        fontWeight: isActive ? 600 : 500,
                        color: textColor,
                      }}
                    />
                  )}
                </ListItem>
              </Tooltip>
            );
          })}
        </List>

        {/* LOGOUT BUTTON AT BOTTOM */}
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />

        <Tooltip title={!open ? 'Logout' : ''} placement="right">
          <ListItem
            button
            onClick={handleLogoutClick}
            sx={{
              color: '#FFFFFF',
              justifyContent: open ? 'flex-start' : 'center',
              px: open ? 1.5 : 0.5,
              mt: 1,
              mb: 2,
              borderRadius: '50px',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.20)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: '#FFFFFF',
                minWidth: 'auto',
                mr: open ? 1.5 : 0,
              }}
            >
              <Logout />
            </ListItemIcon>

            {open && (
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ fontSize: 14 }}
              />
            )}
          </ListItem>
        </Tooltip>
      </StyledDrawer>

      {/* LOGOUT CONFIRMATION POPUP */}
      <Dialog
        open={logoutPopup}
        onClose={() => setLogoutPopup(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#FFf',
            borderRadius: '16px',
            padding: '10px 20px',
            minWidth: '350px',
            textAlign: 'center',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#ED1C24',
            textAlign: 'center',
            pb: 0,
          }}
        >
          Confirm Logout
        </DialogTitle>

        <DialogContent>
          <DialogContentText
            sx={{
              color: '#000',
              fontSize: '16px',
              fontWeight: '500',
              mt: 1,
            }}
          >
            Are you sure you want to logout?
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', mb: 1 }}>
          <Button
            onClick={() => setLogoutPopup(false)}
            variant="outlined"
            sx={{
              borderColor: '#ED1C24',
              color: '#ED1C24',
              px: 3,
              fontWeight: 600,
              borderRadius: '25px',
              '&:hover': {
                borderColor: '#b1121b',
                backgroundColor: 'rgba(237,28,36,0.1)',
              },
            }}
          >
            No
          </Button>

          <Button
            onClick={confirmLogout}
            variant="contained"
            sx={{
              backgroundColor: '#ED1C24',
              color: '#FFF',
              px: 3,
              fontWeight: 600,
              borderRadius: '25px',
            }}
            autoFocus
          >
            Yes, Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
