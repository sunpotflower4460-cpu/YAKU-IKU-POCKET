import { Platform } from 'react-native';
import {
  clearObservationPhotos,
  deleteObservationPhoto,
  persistObservationPhoto,
} from '../observationPhotoStorage';

const mockGetInfoAsync = jest.fn();
const mockMakeDirectoryAsync = jest.fn();
const mockCopyAsync = jest.fn();
const mockDeleteAsync = jest.fn();

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock-documents/',
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  makeDirectoryAsync: (...args: unknown[]) => mockMakeDirectoryAsync(...args),
  copyAsync: (...args: unknown[]) => mockCopyAsync(...args),
  deleteAsync: (...args: unknown[]) => mockDeleteAsync(...args),
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

  it('deduplicates concurrent copies of the same camera URI', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    let resolveCopy!: () => void;
    mockCopyAsync.mockImplementation(
      () => new Promise<void>((resolve) => { resolveCopy = resolve; })
    );

    const first = persistObservationPhoto('file:///cache/same.jpg');
    const second = persistObservationPhoto('file:///cache/same.jpg');

    await Promise.resolve();
    await Promise.resolve();
    expect(mockCopyAsync).toHaveBeenCalledTimes(1);

    resolveCopy();
    const [firstUri, secondUri] = await Promise.all([first, second]);
    expect(secondUri).toBe(firstUri);
  });

  it('uses a safe jpg suffix when a source URI has no usable extension', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockCopyAsync.mockResolvedValue(undefined);

    const result = await persistObservationPhoto('file:///cache/camera-output');

    expect(result).toMatch(/\.jpg$/);
    expect(mockCopyAsync.mock.calls[0][0].to).toMatch(/\.jpg$/);
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

describe('observation photo deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as unknown as { OS: string }).OS = 'ios';
    mockDeleteAsync.mockResolvedValue(undefined);
  });

  it('deletes a photo only when it belongs to the managed observations directory', async () => {
    await deleteObservationPhoto('file:///mock-documents/observations/saved.jpg');
    expect(mockDeleteAsync).toHaveBeenCalledWith(
      'file:///mock-documents/observations/saved.jpg',
      { idempotent: true }
    );

    mockDeleteAsync.mockClear();
    await deleteObservationPhoto('file:///somewhere-else/private.jpg');
    expect(mockDeleteAsync).not.toHaveBeenCalled();
  });

  it('clears the whole managed directory on full data deletion', async () => {
    await clearObservationPhotos();
    expect(mockDeleteAsync).toHaveBeenCalledWith(
      'file:///mock-documents/observations/',
      { idempotent: true }
    );
  });
});
