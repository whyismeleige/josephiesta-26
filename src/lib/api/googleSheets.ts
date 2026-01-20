import { google } from 'googleapis';
import type { IFormField } from '@/lib/models/Form';
import type { IRegistration } from '@/lib/models/Registration';

/**
 * Get authenticated Google Sheets client
 */
export async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

/**
 * Create Google Sheet for event
 */
export async function createGoogleSheet(
  eventId: string,
  eventName: string,
  formFields: IFormField[]
) {
  try {
    const sheets = await getGoogleSheetsClient();

    // Create spreadsheet
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `${eventName} - Registrations`,
        },
        sheets: [
          {
            properties: {
              title: 'Registrations',
              gridProperties: {
                rowCount: 1000,
                columnCount: formFields.length + 5, // Extra columns for metadata
              },
            },
          },
        ],
      },
    });

    const spreadsheetId = createResponse.data.spreadsheetId!;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    // Create header row
    const headers = [
      'Registration ID',
      'Submitted At',
      'Status',
      ...formFields.map((field) => field.label),
      'Last Updated',
    ];

    // Write headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Registrations!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    });

    // Format header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.26,
                    green: 0.26,
                    blue: 0.26,
                  },
                  textFormat: {
                    foregroundColor: {
                      red: 1.0,
                      green: 1.0,
                      blue: 1.0,
                    },
                    fontSize: 11,
                    bold: true,
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: headers.length,
              },
            },
          },
        ],
      },
    });

    // Create column mapping (field ID to column letter)
    const columnMapping: { [key: string]: string } = {
      registration_id: 'A',
      submitted_at: 'B',
      status: 'C',
    };

    formFields.forEach((field, index) => {
      const columnLetter = String.fromCharCode(68 + index); // Start from D (after A, B, C)
      columnMapping[field.id] = columnLetter;
    });

    columnMapping.last_updated = String.fromCharCode(68 + formFields.length);

    // Share with coordinator (if email provided)
    if (process.env.COORDINATOR_EMAIL) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addProtectedRange: {
                protectedRange: {
                  range: {
                    sheetId: 0,
                    startRowIndex: 0,
                    endRowIndex: 1,
                  },
                  description: 'Header row is protected',
                  warningOnly: false,
                },
              },
            },
          ],
        },
      });
    }

    return {
      sheetId: spreadsheetId,
      sheetUrl: spreadsheetUrl,
      columnMapping,
    };
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    const message = error instanceof Error ? error.message : "Creation Error"
    throw new Error(`Failed to create Google Sheet: ${message}`);
  }
}

/**
 * Sync registration to Google Sheet
 */
export async function syncRegistrationToSheet(
  eventId: string,
  registration: IRegistration
) {
  try {
    const sheets = await getGoogleSheetsClient();

    // Get sheet info from database
    const Sheet = (await import('@/lib/models/Sheet')).default;
    const sheetInfo = await Sheet.findOne({ eventId });

    if (!sheetInfo) {
      console.warn('No sheet found for event:', eventId);
      return;
    }

    // Prepare row data
    const rowData: any[] = [
      registration.registrationId,
      registration.submittedAt.toISOString(),
      registration.status,
    ];

    // Add form data in correct column order
    const Form = (await import('@/lib/models/Form')).default;
    const form = await Form.findOne({ eventId, isActive: true });

    if (!form) {
      throw new Error('Form not found');
    }

    form.fields.forEach((field) => {
      const value = registration.formData[field.id];
      
      // Handle array values (checkboxes)
      if (Array.isArray(value)) {
        rowData.push(value.join(', '));
      } else {
        rowData.push(value || '');
      }
    });

    // Add last updated timestamp
    rowData.push(registration.updatedAt.toISOString());

    // Find the next empty row or update existing row
    let targetRow: number;

    if (registration.sheetRowNumber) {
      // Update existing row
      targetRow = registration.sheetRowNumber;
    } else {
      // Find next empty row
      const valuesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetInfo.sheetId,
        range: 'Registrations!A:A',
      });

      const existingRows = valuesResponse.data.values || [];
      targetRow = existingRows.length + 1;

      // Update registration with row number
      registration.sheetRowNumber = targetRow;
      await registration.save();
    }

    // Write data to sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetInfo.sheetId,
      range: `Registrations!A${targetRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [rowData],
      },
    });

    // Apply conditional formatting based on status
    const statusColors = {
      pending: { red: 1.0, green: 0.9, blue: 0.6 }, // Yellow
      approved: { red: 0.7, green: 0.9, blue: 0.7 }, // Green
      rejected: { red: 1.0, green: 0.7, blue: 0.7 }, // Red
    };

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetInfo.sheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: targetRow - 1,
                endRowIndex: targetRow,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: statusColors[registration.status],
                },
              },
              fields: 'userEnteredFormat.backgroundColor',
            },
          },
        ],
      },
    });

    // Update sheet sync status
    sheetInfo.lastSyncStatus = 'success';
    sheetInfo.lastSyncedAt = new Date();
    sheetInfo.totalRowsSynced += 1;
    await sheetInfo.save();

    console.log('Successfully synced registration to sheet:', registration.registrationId);
  } catch (error) {
    console.error('Error syncing to Google Sheet:', error);
    const message = error instanceof Error ? error.message : "Sheet Sync Error"
    // Update sheet sync status
    try {
      const Sheet = (await import('@/lib/models/Sheet')).default;
      await Sheet.findOneAndUpdate(
        { eventId },
        {
          lastSyncStatus: 'failed',
          lastSyncError: message,
          failedSyncCount: { $inc: 1 },
        }
      );
    } catch (updateError) {
      console.error('Failed to update sheet sync status:', updateError);
    }

    throw error;
  }
}

/**
 * Batch sync all registrations for an event
 */
export async function batchSyncRegistrations(eventId: string) {
  try {
    const Registration = (await import('@/lib/models/Registration')).default;
    const registrations = await Registration.find({ eventId }).sort({ submittedAt: 1 });

    let successCount = 0;
    let failCount = 0;

    for (const registration of registrations) {
      try {
        await syncRegistrationToSheet(eventId, registration);
        successCount++;
      } catch (error) {
        console.error('Failed to sync registration:', registration.registrationId, error);
        failCount++;
      }

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      total: registrations.length,
      success: successCount,
      failed: failCount,
    };
  } catch (error) {
    console.error('Batch sync error:', error);
    throw error;
  }
}

/**
 * Share sheet with coordinator
 */
export async function shareSheetWithCoordinator(
  spreadsheetId: string,
  coordinatorEmail: string
) {
  try {
    const drive = google.drive({ version: 'v3' });

    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: coordinatorEmail,
      },
      sendNotificationEmail: true,
    });

    console.log('Sheet shared with coordinator:', coordinatorEmail);
  } catch (error) {
    console.error('Error sharing sheet:', error);
    throw error;
  }
}
