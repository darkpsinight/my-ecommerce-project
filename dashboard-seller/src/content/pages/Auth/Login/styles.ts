import { Box, Card, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

export const MainContent = styled(Box)(({ theme }) => `
    min-height: 100vh;
    display: flex;
    flex: 1;
    overflow: auto;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%);
`);

export const LoginCard = styled(Card)(({ theme }) => `
    padding: ${theme.spacing(4)};
    margin: ${theme.spacing(3)};
    width: 100%;
    max-width: 450px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    border-radius: 16px;
    transition: all 0.3s ease-in-out;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 32px rgba(0,0,0,0.18);
    }
`);

export const LogoBox = styled(Box)(({ theme }) => `
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: ${theme.spacing(3)};
    
    .MuiSvgIcon-root {
        font-size: 3rem;
        color: ${theme.palette.primary.main};
        margin-right: ${theme.spacing(1)};
    }
`);

export const GoogleButton = styled(Button)(({ theme }) => `
    background-color: #fff;
    color: rgba(0, 0, 0, 0.87);
    border: 1px solid rgba(0, 0, 0, 0.12);
    box-shadow: 0 2px 4px rgba(0,0,0,0.08);
    text-transform: none;
    font-weight: 500;
    padding: ${theme.spacing(1.5)};
    border-radius: 8px;
    transition: all 0.3s ease;
    
    &:hover {
        background-color: #f5f5f5;
        box-shadow: 0 4px 8px rgba(0,0,0,0.12);
        transform: translateY(-2px);
    }
    
    .MuiSvgIcon-root {
        margin-right: ${theme.spacing(1)};
        color: #4285F4;
    }
`); 