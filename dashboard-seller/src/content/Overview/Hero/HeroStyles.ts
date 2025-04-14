import { Box, Button, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { ButtonProps } from './types';

export const MotionContainer = styled(motion.div)({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

export const TypographyH1 = styled(Typography)(
  ({ theme }) => `
    font-size: ${theme.typography.pxToRem(54)};
    font-weight: 900;
    background: linear-gradient(45deg, ${theme.colors.primary.dark} 0%, ${theme.colors.primary.main} 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 2px 8px rgba(0,0,0,0.12);
    margin-bottom: ${theme.spacing(2)};
    letter-spacing: -0.5px;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      width: 80px;
      height: 4px;
      background: linear-gradient(90deg, ${theme.colors.primary.main}, transparent);
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      border-radius: 4px;
    }
`
);

export const TypographyH2 = styled(Typography)(
  ({ theme }) => `
    font-size: ${theme.typography.pxToRem(20)};
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
    color: ${theme.colors.alpha.black[70]};
`
);

export const FeatureCard = styled(Paper)(
  ({ theme }) => `
    width: 100%;
    padding: ${theme.spacing(4)};
    border-radius: ${theme.general.borderRadiusXl};
    background: ${theme.palette.mode === 'dark' ? theme.colors.alpha.black[10] : theme.colors.alpha.white[100]};
    color: ${theme.colors.alpha.black[100]};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
    border: 1px solid ${theme.colors.alpha.black[5]};
    text-align: center;
    height: 100%;
    position: relative;
    overflow: hidden;
    z-index: 1;
    backdrop-filter: blur(10px);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, ${theme.colors.primary.light} 0%, ${theme.colors.primary.main} 100%);
      opacity: 0.8;
      transition: height 0.3s ease;
      z-index: -1;
    }

    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 16px 32px rgba(0,0,0,0.12);
      border-color: ${theme.colors.primary.lighter};
      
      &::before {
        height: 6px;
      }
    }
`
);

export const FeatureIcon = styled(Box)(
  ({ theme }) => `
    width: ${theme.spacing(12)};
    height: ${theme.spacing(12)};
    border-radius: 20px;
    background: linear-gradient(135deg, ${theme.colors.primary.light} 0%, ${theme.colors.primary.main} 100%);
    color: ${theme.colors.alpha.white[100]};
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto ${theme.spacing(3)};
    transition: all 0.4s ease;
    box-shadow: 0 10px 20px rgba(33, 150, 243, 0.3);
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 20px;
      border: 2px solid ${theme.colors.primary.lighter};
      top: 0;
      left: 0;
      opacity: 0;
      transform: scale(1.2);
      transition: all 0.4s ease;
    }

    .MuiSvgIcon-root {
      font-size: ${theme.typography.pxToRem(38)};
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }

    &:hover {
      transform: scale(1.05) rotate(2deg);
      box-shadow: 0 12px 24px rgba(33, 150, 243, 0.4);
      border-radius: 16px;
      
      &::after {
        opacity: 0.6;
        transform: scale(1.1);
      }
    }
`
);

export const TestimonialCard = styled(Paper)(
  ({ theme }) => `
    padding: ${theme.spacing(4)};
    border-radius: ${theme.general.borderRadius};
    background: ${theme.colors.alpha.white[100]};
    border: 1px solid ${theme.colors.alpha.black[10]};
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    position: relative;
    transition: all 0.2s;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    
    &::before {
      content: '"';
      position: absolute;
      top: 8px;
      left: 16px;
      font-size: 60px;
      color: ${theme.colors.primary.lighter};
      font-family: Georgia, serif;
      opacity: 0.3;
    }
`
);

export const BackgroundDecoration = styled(Box)(
  ({ theme }) => `
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${theme.colors.primary.lighter} 0%, ${theme.colors.primary.light} 100%);
    top: -200px;
    right: -200px;
    opacity: 0.08;
    z-index: 0;
    animation: pulse 20s infinite ease-in-out;
    
    @keyframes pulse {
      0% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.1) rotate(5deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
`
);

export const BackgroundDecorationLeft = styled(Box)(
  ({ theme }) => `
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${theme.colors.primary.light} 0%, ${theme.colors.secondary.main} 100%);
    bottom: -200px;
    left: -200px;
    opacity: 0.07;
    z-index: 0;
    animation: pulse2 25s infinite ease-in-out;
    
    @keyframes pulse2 {
      0% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.15) rotate(-5deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
`
);

export const BackgroundGrid = styled(Box)(
  ({ theme }) => `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: linear-gradient(${theme.colors.primary.lighter} 1px, transparent 1px),
                      linear-gradient(90deg, ${theme.colors.primary.lighter} 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: center center;
    opacity: 0.015;
    z-index: 0;
    pointer-events: none;
`
);

export const StatBox = styled(Box)(
  ({ theme }) => `
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: ${theme.spacing(2, 0)};
    
    .stat-value {
      font-size: ${theme.typography.pxToRem(36)};
      font-weight: 800;
      color: ${theme.colors.primary.main};
      margin-bottom: ${theme.spacing(0.5)};
      background: linear-gradient(45deg, ${theme.colors.primary.dark} 0%, ${theme.colors.primary.main} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .stat-label {
      font-size: ${theme.typography.pxToRem(14)};
      color: ${theme.colors.alpha.black[70]};
      text-transform: uppercase;
      letter-spacing: 1px;
    }
`
);

export const StyledButton = styled(Button)<ButtonProps>(({ theme }) => ({
  padding: theme.spacing(1.5, 3),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 16px rgba(0, 0, 0, 0.15)`,
  },
}));

export const PrimaryButton = styled(StyledButton)<ButtonProps>(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.colors.primary.light} 0%, ${theme.colors.primary.main} 100%)`,
  color: theme.colors.alpha.white[100],
}));

export const SecondaryButton = styled(StyledButton)<ButtonProps>(({ theme }) => ({
  background: theme.colors.alpha.white[100],
  color: theme.colors.primary.main,
  '&:hover': {
    background: theme.colors.alpha.white[90],
  },
})); 