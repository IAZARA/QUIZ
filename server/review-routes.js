const express = require('express');
const Review = require('./models/Review'); // Adjust path as necessary
const PdfPrinter = require('pdfmake');
const { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, BorderStyle } = require('docx');

// Define fonts for pdfmake
const fonts = {
  Roboto: {
    normal: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Regular.ttf'], 'base64'),
    bold: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Medium.ttf'], 'base64'),
    italics: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Italic.ttf'], 'base64'),
    bolditalics: Buffer.from(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-MediumItalic.ttf'], 'base64')
  }
};
const printer = new PdfPrinter(fonts);

const router = express.Router();

// POST /api/reviews - Create a new review
router.post('/', async (req, res) => {
  try {
    const { eventId, rating, comment, authorId, isAnonymous } = req.body;

    // Basic validation
    if (!eventId || !rating || !authorId) {
      return res.status(400).json({ message: 'Missing required fields: eventId, rating, and authorId are required.' });
    }

    // Additional validation for rating (already in schema, but good for early feedback)
    if (typeof rating !== 'number' || rating < 1 || rating > 10) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 10.' });
    }

    const newReview = new Review({
      eventId,
      rating,
      comment,
      authorId,
      isAnonymous,
    });

    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (error) {
    if (error.name === 'ValidationError') {
      // Mongoose validation error
      return res.status(400).json({ message: error.message });
    }
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Server error while creating review.' });
  }
});

// GET /api/reviews/export - Export reviews as PDF or Word
router.get('/export', async (req, res) => {
  try {
    const { eventId, format } = req.query;

    if (!eventId || !format) {
      return res.status(400).json({ message: 'eventId and format are required query parameters.' });
    }

    if (format !== 'pdf' && format !== 'word') {
      return res.status(400).json({ message: "Invalid format specified. Must be 'pdf' or 'word'." });
    }

    const reviews = await Review.find({ eventId }).sort({ createdAt: -1 }).lean();

    if (format === 'pdf') {
      const docDefinition = {
        content: [
          { text: `Event Reviews - Event ID: ${eventId}`, style: 'header' },
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 20]
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            color: 'black',
            fillColor: '#eeeeee',
            margin: [0, 5, 0, 5]
          },
          tableCell: {
            fontSize: 9,
            margin: [0, 5, 0, 5]
          },
          commentCell: {
            fontSize: 9,
            italics: true,
            margin: [0, 5, 0, 5]
          },
          reviewTable: {
            margin: [0, 0, 0, 15] // Margin bottom for each table
          }
        },
        defaultStyle: {
          font: 'Roboto'
        }
      };

      if (reviews.length === 0) {
        docDefinition.content.push({ text: 'No reviews found for this event.', style: 'tableCell' });
      } else {
        reviews.forEach(review => {
          docDefinition.content.push({
            table: {
              widths: ['auto', '*'],
              body: [
                [{ text: 'Rating', style: 'tableHeader' }, { text: `${review.rating}/10`, style: 'tableCell' }],
                [{ text: 'Author', style: 'tableHeader' }, { text: review.isAnonymous ? 'Anonymous' : review.authorId, style: 'tableCell' }],
                [{ text: 'Date', style: 'tableHeader' }, { text: new Date(review.createdAt).toLocaleString(), style: 'tableCell' }],
                [{ text: 'Comment', style: 'tableHeader', colSpan: 2 }, {}],
                [{ text: review.comment || '', style: 'commentCell', colSpan: 2 }, {}]
              ]
            },
            layout: {
              hLineWidth: function (i, node) {
                return (i === 0 || i === node.table.body.length || i === node.table.body.length -1 || i === 3) ? 1 : 0.5;
              },
              vLineWidth: function (i, node) {
                return (i === 0 || i === node.table.widths.length) ? 1 : 0.5;
              },
              hLineColor: function (i, node) {
                return (i === 0 || i === node.table.body.length) ? 'black' : 'gray';
              },
              vLineColor: function (i, node) {
                return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';
              },
               paddingTop: function(i, node) { return 5; },
               paddingBottom: function(i, node) { return 5; },
            },
            style: 'reviewTable'
          });
        });
      }

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="reviews-${eventId}.pdf"`);
      pdfDoc.pipe(res);
      pdfDoc.end();

    } else if (format === 'word') {
      const children = [
        new Paragraph({
          children: [new TextRun({ text: `Event Reviews - Event ID: ${eventId}`, bold: true, size: 32 })],
          spacing: { after: 400 },
        }),
      ];

      if (reviews.length === 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: "No reviews found for this event."}) ]}));
      } else {
        reviews.forEach(review => {
          children.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Rating", bold: true })] })], width: {size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph(`${review.rating}/10`)] , width: {size: 80, type: WidthType.PERCENTAGE }}),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Author", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(review.isAnonymous ? 'Anonymous' : review.authorId)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(new Date(review.createdAt).toLocaleString())] }),
                  ],
                }),
                 new TableRow({
                  children: [
                    new TableCell({ 
                        children: [new Paragraph({ children: [new TextRun({ text: "Comment", bold: true })]})],
                        columnSpan: 2,
                     }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ 
                        children: [new Paragraph({ children: [new TextRun({ text: review.comment || '', italics: true })]})],
                        columnSpan: 2,
                     }),
                  ],
                }),
              ],
              borders: { // Optional: Add borders to the table
                top: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
              },
            })
          );
          children.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Spacer paragraph
        });
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="reviews-${eventId}.docx"`);
      res.send(buffer);
    }
  } catch (error) {
    console.error('Error exporting reviews:', error);
    res.status(500).json({ message: 'Error exporting reviews', error: error.message });
  }
});

// GET /api/reviews - Fetch reviews for a specific event
router.get('/', async (req, res) => {
  try {
    const { eventId } = req.query;

    if (!eventId) {
      return res.status(400).json({ message: 'eventId is required' });
    }

    const reviews = await Review.find({ eventId: eventId }).sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

module.exports = router;
