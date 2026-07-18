import { Platform } from 'react-native';
import { persistObservationPhoto } from '../observationPhotoStorage';

const mockGetInfoAsync = jest.fn();
const mockMakeDirectoryAsync = jest.fn();
const mockCopyAsync = jest.fn();

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock-documents/',
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  makeDirectoryAsync: (...args: unknown[]) => mockMakeDirectoryAsync(...args),
  copyAsync: (...args: unknown[]) => mockCopyAsync(...args),
}));

describe('persistObservationPhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as unknown as { OS: string }).OS = 'ios';
  });

  it('copies the cache photo into the documents dir and returns the new URI', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockCopyAsync.mockResolvedValue(undefined);

    const result = await persistObservationPhoto('file:///cache/photo123.jpg');

    expect(mockCopyAsync).toHaveBeenCalledTimes(1);
    const call = mockCopyAsync.mock.calls[0][0];
    expect(call.from).toBe('file:///cache/photo123.jpg');
    expect(call.to).toMatch(/^file:\/\/\/mock-documents\/observations\/.*\.jpg$/);
    expect(result).toBe(call.to);
  });

  it('creates the observations directory if it does not exist yet', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: false });
    mockCopyAsync.mockResolvedValue(undefined);

    await persistObservationPhoto('file:///cache/a.jpg');

    expect(mockMakeDirectoryAsync).toHaveBeenCalledWith(
      'file:///mock-documents/observations/',
      { intermediates: true }
    );
  });

  it('falls back to the original URI on web (no durable/cache distinction there)', async () => {
    (Platform as unknown as { OS: string }).OS = 'web';
    const result = await persistObservationPhoto('blob:http://localhost/abc');
    expect(result).toBe('blob:http://localhost/abc');
    expect(mockCopyAsync).not.toHaveBeenCalled();
  });

  it('falls back to the original URI if the copy fails', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockCopyAsync.mockRejectedValue(new Error('disk full'));

    const result = await persistObservationPhoto('file:///cache/photo.jpg');
    expect(result).toBe('file:///cache/photo.jpg');
  });
});
