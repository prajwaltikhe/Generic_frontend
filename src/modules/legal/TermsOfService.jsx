import logo from '../../assets/logo.png';
import { Box, Container, Paper, Typography } from '@mui/material';
import {
  TERMS_DOCUMENT_TITLE,
  TERMS_EFFECTIVE_DATE,
  TERMS_SECTIONS,
} from './termsOfServiceSections';

export default function TermsOfService() {
  return (
    <div className='min-h-screen bg-[#ecf0f5]'>
      <Container maxWidth='md' className='py-6 px-3'>
        <Box className='flex flex-col items-center mb-4'>
          <img src={logo} alt='' className='w-24 mb-2 object-contain' />
        </Box>

        <Paper elevation={2} className='p-6 md:p-8'>
          <Typography variant='h5' component='h1' className='font-bold text-[#07163d] mb-1'>
            {TERMS_DOCUMENT_TITLE}
          </Typography>
          {TERMS_EFFECTIVE_DATE ? (
            <Typography variant='body2' color='text.secondary' className='mb-3'>
              Effective date: {TERMS_EFFECTIVE_DATE}
            </Typography>
          ) : null}

          <article className='space-y-6'>
            {TERMS_SECTIONS.map((section) => (
              <section key={section.title}>
                <Typography variant='subtitle1'
                  component='h2'
                  className='font-semibold text-[#07163d] mb-2'>
                  {section.title}
                </Typography>
                {section.paragraphs.map((p, i) => (
                  <Typography
                    key={i}
                    variant='body2'
                    color='text.primary'
                    className='mb-2 whitespace-pre-wrap leading-relaxed'>
                    {p}
                  </Typography>
                ))}
              </section>
            ))}
          </article>

        </Paper>
      </Container>
    </div>
  );
}
