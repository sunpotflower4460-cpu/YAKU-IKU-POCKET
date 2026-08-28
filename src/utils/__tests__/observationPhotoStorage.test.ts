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
  beforeEach(async () => {
    jest.restoreAllMocks();
    (Platform as unknown as { OS: string }).OS = 'ios';
    mockDeleteAsync.mockResolvedValue(undefined);
    // Reset the module's in-memory dedupe/directory state between tests too,
    // not only Jest's mock call history.
    await clearObservationPhotos();
    jest.clearAllMocks();
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

  it('serializes first-use directory creation for different concurrent photos', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: false });
    let resolveMakeDir!: () => void;
    mockMakeDirectoryAsync.mockImplementation(
      () => new Promise<void>((resolve) => { resolveMakeDir = resolve; })
    );
    mockCopyAsync.mockResolvedValue(undefined);

    const first = persistObservationPhoto('file:///cache/parallel-a.jpg');
    const second = persistObservationPhoto('file:///cache/parallel-b.jpg');

    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(mockGetInfoAsync).toHaveBeenCalledTimes(1);
    expect(mockMakeDirectoryAsync).toHaveBeenCalledTimes(1);

    resolveMakeDir();
    await Promise.all([first, second]);
    expect(mockCopyAsync).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent copies of the same camera URI', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    let resolveCopy!: () => void;
    mockCopyAsync.mockImplementation(
      () => new Promise<void>((resolve) => { resolveCopy = resolve; })
    );

    const first = persistObservationPhoto('file:///cache/same.jpg');
    const second = persistObservationPhoto('file:///cache/same.jpg');

    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(mockCopyAsync).toHaveBeenCalledTimes(1);

    resolveCopy();
    const [firstUri, secondUri] = await Promise.all([first, second]);
    expect(secondUri).toBe(firstUri);
  });

  it('gives different photos unique destinations even when time and random repeat exactly', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockCopyAsync.mockResolvedValue(undefined);
    jest.spyOn(Date, 'now').mockReturnValue(1780000000000);
    jest.spyOn(Math, 'random').mockReturnValue(0);

    await Promise.all([
      persistObservationPhoto('file:///cache/collision-a.jpg'),
      persistObservationPhoto('file:///cache/collision-b.jpg'),
    ]);

    expect(mockCopyAsync).toHaveBeenCalledTimes(2);
    const destinations = mockCopyAsync.mock.calls.map(([args]) => args.to as string);
    expect(new Set(destinations).size).toBe(2);
    expect(destinations[0]).not.toBe(destinations[1]);
  });

  it('reuses a just-completed copy for a queued repeat tap', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockCopyAsync.mockResolvedValue(undefined);

    const firstUri = await persistObservationPhoto('file:///cache/queued-tap.jpg');
    const secondUri = await persistObservationPhoto('file:///cache/queued-tap.jpg');

    expect(mockCopyAsync).toHaveBeenCalledTimes(1);
    expect(secondUri).toBe(firstUri);
  });

  it('does not cache a failed copy, so a transient failure can retry', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    mockCopyAsync
      .mockRejectedValueOnce(new Error('temporary disk error'))
      .mockResolvedValueOnce(undefined);

    const source = 'file:///cache/retry.jpg';
    const first = await persistObservationPhoto(source);
    const second = await persistObservationPhoto(source);

    expect(first).toBe(source);
    expect(second).not.toBe(source);
    expect(mockCopyAsync).toHaveBeenCalledTimes(2);
  });

  it('invalidates and removes a copy that finishes after a full reset', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: true });
    let resolveCopy!: () => void;
    mockCopyAsync.mockImplementation(
      () => new Promise<void>((resolve) => { resolveCopy = resolve; })
    );

    const source = 'file:///cache/reset-race.jpg';
    const pending = persistObservationPhoto(source);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(mockCopyAsync).toHaveBeenCalledTimes(1);
    const staleDest = mockCopyAsync.mock.calls[0][0].to as string;

    await clearObservationPhotos();
    resolveCopy();

    await expect(pending).resolves.toBe(source);
    expect(mockDeleteAsync).toHaveBeenCalledWith(
      'file:///mock-documents/observations/',
      { idempotent: true }
    );
    expect(mockDeleteAsync).toHaveBeenCalledWith(staleDest, { idempotent: true });
  });

  it('waits for reset directory cleanup before saving a new-generation photo', async () => {
    mockGetInfoAsync.mockResolvedValue({ exists: false });
    mockMakeDirectoryAsync.mockResolvedValue(undefined);
    mockCopyAsync.mockResolvedValue(undefined);

    let resolveClear!: () => void;
    mockDeleteAsync.mockImplementationOnce(
      () => new Promise<void>((resolve) => { resolveClear = resolve; })
    );

    const clearing = clearObservationPhotos();
    const newSave = persistObservationPhoto('file:///cache/after-reset.jpg');

    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(mockCopyAsync).not.toHaveBeenCalled();
    expect(mockGetInfoAsync).not.toHaveBeenCalled();

    resolveClear();
    await clearing;
    const savedUri = await newSave;

    expect(mockCopyAsync).toHaveBeenCalledTimes(1);
    expect(savedUri).toMatch(/^file:\/\/\/mock-documents\/observations\//);
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
    jest.restoreAllMocks();
    jest.clearAllMocks();
    (Platform as unknown as { OS: string }).OS = 'ios';
    mockDeleteAsync.mockResolvedValue(undefined);
  });

  it('deletes legacy and current direct-child photos, but no arbitrary paths', async () => {
    const legacyUri = 'file:///mock-documents/observations/1780000000000_abc123.jpg';
    const currentUri = 'file:///mock-documents/observations/1780000000000_1_abc123.jpg';

    await deleteObservationPhoto(legacyUri);
    expect(mockDeleteAsync).toHaveBeenCalledWith(legacyUri, { idempotent: true });
    await deleteObservationPhoto(currentUri);
    expect(mockDeleteAsync).toHaveBeenCalledWith(currentUri, { idempotent: true });

    for (const unsafeUri of [
      'file:///somewhere-else/private.jpg',
      'file:///mock-documents/observations/../private.jpg',
      'file:///mock-documents/observations/nested/1780000000000_1_abc123.jpg',
      'file:///mock-documents/observations/not-generated.jpg',
    ]) {
      mockDeleteAsync.mockClear();
      await deleteObservationPhoto(unsafeUri);
      expect(mockDeleteAsync).not.toHaveBeenCalled();
    }
  });

  it('clears the whole managed directory on full data deletion', async () => {
    await clearObservationPhotos();
    expect(mockDeleteAsync).toHaveBeenCalledWith(
      'file:///mock-documents/observations/',
      { idempotent: true }
    );
  });
});
