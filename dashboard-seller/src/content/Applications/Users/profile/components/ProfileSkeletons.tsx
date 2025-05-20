import React from 'react';
import { Box, Card, Skeleton, styled } from '@mui/material';

// Styled components to match the dimensions of the actual components
const CardCoverSkeleton = styled(Card)(
  ({ theme }) => `
    position: relative;
    height: ${theme.spacing(26)}; /* Match the fixed height of CardCover */
    width: 100%;
    overflow: hidden;
    border-radius: ${theme.shape.borderRadius}px;
    box-shadow: ${theme.shadows[3]};

    @media (max-width: ${theme.breakpoints.values.sm}px) {
      height: ${theme.spacing(22)}; /* Match the smaller fixed height for small screens */
    }

    @media (max-width: ${theme.breakpoints.values.xs}px) {
      height: ${theme.spacing(18)}; /* Match the even smaller fixed height for extra small screens */
    }
  `
);

const AvatarWrapperSkeleton = styled(Card)(
  ({ theme }) => `
    position: relative;
    overflow: visible;
    display: inline-block;
    margin-top: -${theme.spacing(7)}; /* Match the AvatarWrapper component */
    margin-left: ${theme.spacing(2)};
    width: ${theme.spacing(14)};
    height: ${theme.spacing(14)};
    border-radius: ${theme.shape.borderRadius}px;

    @media (max-width: ${theme.breakpoints.values.sm}px) {
      margin-top: -${theme.spacing(6)}; /* Match the AvatarWrapper component for small screens */
      margin-left: ${theme.spacing(2)};
      width: ${theme.spacing(12)};
      height: ${theme.spacing(12)};
    }

    @media (max-width: ${theme.breakpoints.values.xs}px) {
      margin-top: -${theme.spacing(5)}; /* Match the AvatarWrapper component for extra small screens */
      margin-left: ${theme.spacing(1.5)};
      width: ${theme.spacing(10)};
      height: ${theme.spacing(10)};
    }
  `
);

const ButtonUploadWrapperSkeleton = styled(Box)(
  ({ theme }) => `
    position: absolute;
    width: ${theme.spacing(4)};
    height: ${theme.spacing(4)};
    bottom: -${theme.spacing(1)};
    right: -${theme.spacing(1)};
  `
);

const CardCoverActionSkeleton = styled(Box)(
  ({ theme }) => `
    position: absolute;
    right: ${theme.spacing(2)};
    bottom: ${theme.spacing(2)};
  `
);

/**
 * Skeleton loader for the profile cover image
 */
export const ProfileCoverSkeleton: React.FC = () => {
  return (
    <>
      <Box display="flex" mb={3}>
        <Box>
          <Skeleton variant="text" width={250} height={40} />
          <Skeleton variant="text" width={300} height={24} />
        </Box>
      </Box>
      <CardCoverSkeleton>
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
        />
        <CardCoverActionSkeleton>
          <Skeleton
            variant="rectangular"
            width={140}
            height={36}
            animation="wave"
          />
        </CardCoverActionSkeleton>
      </CardCoverSkeleton>
      <AvatarWrapperSkeleton>
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
        />
        <ButtonUploadWrapperSkeleton>
          <Skeleton
            variant="circular"
            width={32}
            height={32}
            animation="wave"
          />
        </ButtonUploadWrapperSkeleton>
      </AvatarWrapperSkeleton>
      <Box py={2} pl={2} mb={3}>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="text" width={250} height={24} />
        <Box sx={{ py: 2 }}>
          <Skeleton variant="text" width={180} height={24} />
        </Box>
        <Box
          display={{ xs: 'block', md: 'flex' }}
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Skeleton variant="rectangular" width={100} height={32} />
          </Box>
        </Box>
      </Box>
    </>
  );
};

/**
 * Skeleton loader for the profile content sections
 */
export const ProfileContentSkeleton: React.FC = () => {
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="70%" height={20} sx={{ mb: 2 }} />

      <Box sx={{ mb: 3 }}>
        {Array.from(new Array(3)).map((_, index) => (
          <Skeleton
            key={`line-${index}`}
            variant="text"
            width={`${Math.floor(Math.random() * 30) + 70}%`}
            height={20}
            sx={{ mb: 1 }}
          />
        ))}
      </Box>

      <Skeleton variant="rectangular" width="100%" height={120} sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </Box>
    </Box>
  );
};
