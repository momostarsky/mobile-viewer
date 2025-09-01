// src/utils/getFirstDicomOfEachSeries.ts
export interface SeriesInfo {
  modality: string;
  seriesNum: string;
  accNum: string;
  patientId: string;
  patientName: string;
  patientAge: string;
  patientSex: string;
  birthDate: string;
  instManu: string;
  instDepart: string;
  instAddr: string;
  instName: string;
  studyDate: string;
  studyTime: string;
  seriesUid: string;
  firstSopUid?: string;
  numberOfInstances: number;
}

export interface StudyMetadata {
  seriesData: SeriesData[];
}

export interface SeriesData {
  '00080060': string;    // Modality
  '00200011': string;    // Series Number
  '00080050': string;    // Accession Number
  '00100020': string;    // Patient ID
  '00100010': string;    // Patient Name
  '00101010': string;    // Patient Age
  '00100040': string;    // Patient Sex
  '00100030': string;    // Birth Date
  '00080070': string;    // Institution Manufacturer
  '00081040': string;    // Institution Department
  '00080081': string;    // Institution Address
  '00080080': string;    // Institution Name
  '00080020': string;    // Study Date
  '00080030': string;    // Study Time
  '0020000E': string;    // Series UID
  sopData?: SopData[];   // SOP Data array
}

export interface SopData {
  '00080018': string;    // SOP Instance UID
  '00180050'?: string;   // Instance Number (can be undefined)
  // 其他可能的字段...
}

export function getFirstDicomOfEachSeries(studyMetadata: StudyMetadata): SeriesInfo[] {
  // 先对 seriesData 按 seriesNum 排序
  studyMetadata.seriesData.sort((a, b) => {
    const seriesNumA = a['00200011'];
    const seriesNumB = b['00200011'];

    // 转换为数字进行比较
    const numA = parseInt(seriesNumA, 10);
    const numB = parseInt(seriesNumB, 10);

    // 处理无法转换为数字的情况
    if (isNaN(numA) && isNaN(numB)) return 0;
    if (isNaN(numA)) return 1;
    if (isNaN(numB)) return -1;

    return numA - numB;
  });

  // 然后对每个系列的 sopData 按 InstanceNumber 排序
  for (const seriesData of studyMetadata.seriesData) {
    if (seriesData.sopData && seriesData.sopData.length > 0) {
      seriesData.sopData.sort((a, b) => {
        const instanceNumA = a['00180050'];
        const instanceNumB = b['00180050'];

        // 如果两个都没有 InstanceNumber，保持原顺序
        if (!instanceNumA && !instanceNumB) return 0;

        // 没有 InstanceNumber 的排在后面
        if (!instanceNumA) return 1;
        if (!instanceNumB) return -1;

        // 转换为数字进行比较
        const numA = parseInt(instanceNumA, 10);
        const numB = parseInt(instanceNumB, 10);

        // 处理无法转换为数字的情况
        if (isNaN(numA) && isNaN(numB)) return 0;
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;

        return numA - numB;
      });
    }
  }

  // 提取每个系列的信息
  const series: SeriesInfo[] = [];
  for (const seriesData of studyMetadata.seriesData) {
    const firstSopUid = seriesData.sopData && seriesData.sopData.length > 0
      ? seriesData.sopData[0]['00080018']
      : undefined;

    const seriesInfo: SeriesInfo = {
      modality: seriesData['00080060'],
      seriesNum: seriesData['00200011'],
      accNum: seriesData['00080050'],
      patientId: seriesData['00100020'],
      patientName: seriesData['00100010'],
      patientAge: seriesData['00101010'],
      patientSex: seriesData['00100040'],
      birthDate: seriesData['00100030'],
      instManu: seriesData['00080070'],
      instDepart: seriesData['00081040'],
      instAddr: seriesData['00080081'],
      instName: seriesData['00080080'],
      studyDate: seriesData['00080020'],
      studyTime: seriesData['00080030'],
      seriesUid: seriesData['0020000E'],
      firstSopUid: firstSopUid, numberOfInstances: seriesData.sopData.length,
    };


    series.push(seriesInfo);
  }

  return series;
}
