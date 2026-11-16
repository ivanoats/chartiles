import {getCollection} from 'astro:content';

// Local builds and Netlify deploy previews are used for editorial review.
export const showDrafts = process.env.CONTEXT !== 'production';
export const getPosts = () => getCollection('blog', ({data}) => showDrafts || !data.draft);
export const formatDate = date => new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeZone: 'UTC',
}).format(date);
