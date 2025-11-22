export async function parseKeepTakeout(file) {
  const zip = new JSZip();
  await zip.loadAsync(file);
  
  const notes = [];
  
  // Google Keep takeout structure has changed over time
  // Let's handle multiple possible structures
  
  for (const [filename, fileObj] of Object.entries(zip.files)) {
    // Try different patterns for Google Keep files
    if (filename.includes('Keep/') || filename.includes('Google Keep/') || filename.endsWith('.html') || filename.endsWith('.json')) {
      try {
        // Handle JSON files (newer format)
        if (filename.endsWith('.json')) {
          const content = await fileObj.async('string');
          const noteData = JSON.parse(content);
          
          // Extract title and content from JSON structure
          let title = noteData.title || '';
          let contentText = noteData.textContent || '';
          
          // Handle lists
          if (noteData.listContent && Array.isArray(noteData.listContent)) {
            contentText = noteData.listContent.map(item => `• ${item.text}`).join('\n');
          }
          
          notes.push({
            title: title || 'Untitled',
            content: contentText,
            tags: noteData.labels ? noteData.labels.map(label => label.name) : [],
            isPinned: noteData.isPinned || false,
            themeId: 'base'
          });
        }
        // Handle HTML files (older format)
        else if (filename.endsWith('.html')) {
          const content = await fileObj.async('string');
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'text/html');
          
          const titleElement = doc.querySelector('title') || doc.querySelector('h1');
          const title = titleElement ? titleElement.textContent : filename.split('/').pop().replace('.html', '');
          
          // Extract content from HTML
          let contentText = '';
          const body = doc.querySelector('body');
          if (body) {
            contentText = body.textContent || '';
          }
          
          notes.push({
            title: title || 'Untitled',
            content: contentText,
            tags: [],
            isPinned: false,
            themeId: 'base'
          });
        }
        // Handle text files
        else if (filename.endsWith('.txt')) {
          const content = await fileObj.async('string');
          const title = filename.split('/').pop().replace('.txt', '');
          
          notes.push({
            title: title || 'Untitled',
            content: content,
            tags: [],
            isPinned: false,
            themeId: 'base'
          });
        }
      } catch (error) {
        console.warn(`Failed to process file ${filename}:`, error);
      }
    }
  }
  
  // If no notes found with the above patterns, try to find any JSON files
  if (notes.length === 0) {
    for (const [filename, fileObj] of Object.entries(zip.files)) {
      if (filename.endsWith('.json')) {
        try {
          const content = await fileObj.async('string');
          const noteData = JSON.parse(content);
          
          // Handle the case where the JSON might be an array of notes
          if (Array.isArray(noteData)) {
            noteData.forEach(note => {
              if (note.title || note.textContent) {
                notes.push({
                  title: note.title || 'Untitled',
                  content: note.textContent || '',
                  tags: note.labels || [],
                  isPinned: note.isPinned || false,
                  themeId: 'base'
                });
              }
            });
          }
          // Single note object
          else if (noteData.title || noteData.textContent) {
            notes.push({
              title: noteData.title || 'Untitled',
              content: noteData.textContent || '',
              tags: noteData.labels || [],
              isPinned: noteData.isPinned || false,
              themeId: 'base'
            });
          }
        } catch (error) {
          console.warn(`Failed to process JSON file ${filename}:`, error);
        }
      }
    }
  }
  
  console.log(`Imported ${notes.length} notes from Google Keep`);
  return notes;
}import JSZip from 'jszip';