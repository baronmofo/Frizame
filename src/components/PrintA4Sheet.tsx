import React from 'react';
import { Flame, Snowflake, UtensilsCrossed } from 'lucide-react';
import { FrizameLogo } from './FrizameLogo';

interface PrintA4SheetProps {
  labelConfig: {
    productoNombre: string;
    lote: string;
    vencimiento: string;
    pesoNeto: string;
    conservacion?: string;
    ingredientes?: string;
    alergenos?: string;
    picSarten?: boolean;
    picHorno?: boolean;
    picSinDescongelar?: boolean;
    qrCodeUrl?: string;
    rotuloImagenJpg?: string;
    stickerImagenJpg?: string;
    printType?:
      | 'rotulo'
      | 'sticker'
      | 'individual'
      | 'a4'
      | 'a4_apaisada'
      | 'a4_vertical'
      | 'legal_apaisada'
      | 'legal_vertical';
  } | null;
}

export const PrintA4Sheet: React.FC<PrintA4SheetProps> = ({ labelConfig }) => {
  if (!labelConfig) return null;

  const printType = labelConfig.printType || 'rotulo';

  // Handle Full Page Formats ("Otros" category): A4 Apaisada, A4 Vertical, Legal Apaisada, Legal Vertical
  if (
    printType === 'a4' ||
    printType === 'a4_vertical' ||
    printType === 'a4_apaisada' ||
    printType === 'legal_vertical' ||
    printType === 'legal_apaisada'
  ) {
    let dimensionsClass = 'h-[297mm] w-[210mm] print-page-a4-vertical'; // default A4 Vertical
    let titleOrientation = 'A4 VERTICAL';

    if (printType === 'a4_apaisada') {
      dimensionsClass = 'h-[210mm] w-[297mm] print-page-a4-apaisada';
      titleOrientation = 'A4 APAISADA';
    } else if (printType === 'legal_vertical') {
      dimensionsClass = 'h-[356mm] w-[216mm] print-page-legal-vertical';
      titleOrientation = 'LEGAL VERTICAL';
    } else if (printType === 'legal_apaisada') {
      dimensionsClass = 'h-[216mm] w-[356mm] print-page-legal-apaisada';
      titleOrientation = 'LEGAL APAISADA';
    }

    return (
      <div
        id="printSheetA4"
        className={`only-print hidden p-8 flex flex-col justify-between bg-white text-black ${dimensionsClass}`}
      >
        <div className="border-b-2 border-black pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-brand font-black uppercase">{labelConfig.productoNombre}</h1>
            <p className="text-xs font-semibold tracking-wider text-gray-700">
              FRIZAME — CONGELADOS PREMIUM • FORMATO {titleOrientation}
            </p>
          </div>
          {labelConfig.qrCodeUrl && (
            <img src={labelConfig.qrCodeUrl} alt="QR Code" className="w-20 h-20 object-contain" />
          )}
        </div>

        <div className="flex-1 my-6 flex flex-col items-center justify-center border border-gray-300 rounded-xl p-6 bg-gray-50">
          {labelConfig.rotuloImagenJpg || labelConfig.stickerImagenJpg ? (
            <img
              src={labelConfig.rotuloImagenJpg || labelConfig.stickerImagenJpg}
              alt={labelConfig.productoNombre}
              className="max-h-[18cm] max-w-full object-contain"
            />
          ) : (
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto">
                <FrizameLogo variant="full" className="w-full h-full" />
              </div>
              <h2 className="text-2xl font-bold font-brand uppercase">{labelConfig.productoNombre}</h2>
              {labelConfig.ingredientes && (
                <p className="text-base text-gray-600 max-w-md mx-auto">{labelConfig.ingredientes}</p>
              )}
            </div>
          )}
        </div>

        {labelConfig.pesoNeto || labelConfig.lote ? (
          <div className="border-t-2 border-black pt-4 flex justify-between items-center text-sm font-bold">
            {labelConfig.pesoNeto && <span>Presentación: {labelConfig.pesoNeto}</span>}
            {labelConfig.lote && <span>Lote: {labelConfig.lote}</span>}
            {labelConfig.vencimiento && <span>Vencimiento: {labelConfig.vencimiento}</span>}
          </div>
        ) : (
          <div className="border-t-2 border-black pt-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700">
            FRIZAME — MATERIAL DE DIFUSIÓN E IMPRESIÓN OFICIAL
          </div>
        )}
      </div>
    );
  }

  if (printType === 'individual') {
    return (
      <div id="printSheetA4" className="only-print print-sheet-a4-portrait hidden p-12 flex items-center justify-center h-[297mm] w-[210mm] bg-white">
        <div className="w-[18cm] h-[24cm] border-2 border-black rounded-xl p-6 flex flex-col justify-between bg-white text-black">
          <div className="border-b border-black pb-2 flex justify-between items-center">
            <span className="font-brand font-bold text-lg">FRIZAME</span>
            <span className="text-xs uppercase font-semibold">MATERIAL IMPRESIÓN INDIVIDUAL</span>
          </div>

          <div className="flex-1 my-4 flex items-center justify-center overflow-hidden">
            {labelConfig.rotuloImagenJpg || labelConfig.stickerImagenJpg ? (
              <img
                src={labelConfig.rotuloImagenJpg || labelConfig.stickerImagenJpg}
                alt={labelConfig.productoNombre}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-center space-y-3">
                <FrizameLogo variant="full" className="w-24 h-24 mx-auto" />
                <h3 className="text-xl font-bold font-brand uppercase">{labelConfig.productoNombre}</h3>
              </div>
            )}
          </div>

          {labelConfig.pesoNeto || labelConfig.lote ? (
            <div className="bg-black text-white p-3 flex justify-between items-center text-xs font-bold rounded-lg">
              {labelConfig.pesoNeto && <span>{labelConfig.pesoNeto}</span>}
              {labelConfig.lote && <span>Lote: {labelConfig.lote}</span>}
              {labelConfig.vencimiento && <span>Venc: {labelConfig.vencimiento}</span>}
            </div>
          ) : (
            <div className="bg-black text-white p-3 text-center text-xs font-bold rounded-lg uppercase tracking-wider">
              FRIZAME — CONGELADOS PREMIUM
            </div>
          )}
        </div>
      </div>
    );
  }

  if (printType === 'sticker') {
    // Generate exactly 30 sticker copies for A4 Portrait 5x6 grid
    const stickerCopies = Array.from({ length: 30 });

    return (
      <div id="printSheetA4" className="only-print print-sheet-a4-portrait hidden">
        {stickerCopies.map((_, index) => (
          <div key={index} className="sticker-print-portrait">
            {labelConfig.stickerImagenJpg ? (
              <img
                src={labelConfig.stickerImagenJpg}
                alt={labelConfig.productoNombre}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-between p-1">
                <div className="w-12 h-12 flex items-center justify-center">
                  <FrizameLogo variant="full" className="w-full h-full" />
                </div>
                <span className="font-brand font-black text-[8pt] uppercase leading-tight text-black tracking-tight line-clamp-2 mt-1">
                  {labelConfig.productoNombre}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Generate 9 label copies for A4 Landscape 3x3 grid (Rótulo)
  const copies = Array.from({ length: 9 });

  return (
    <div id="printSheetA4" className="only-print print-sheet-a4-landscape hidden">
      {copies.map((_, index) => (
        <div key={index} className="rotulo-print-landscape">
          {labelConfig.rotuloImagenJpg ? (
            <div className="w-full h-full relative flex flex-col justify-between bg-white overflow-hidden p-1">
              <div className="flex-1 w-full flex items-center justify-center overflow-hidden relative">
                <img
                  src={labelConfig.rotuloImagenJpg}
                  alt={labelConfig.productoNombre}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="bg-black text-white px-2 py-1 flex justify-between items-center text-[8pt] font-bold border-t border-black shrink-0">
                <span>{labelConfig.pesoNeto}</span>
                <span className="text-center font-bold text-white">L: {labelConfig.lote}</span>
                <span>{labelConfig.vencimiento}</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col justify-between text-black bg-white">
              {/* Header Bar */}
              <div className="bg-black text-white px-2 py-0.5 flex justify-between items-center text-[9pt] font-bold">
                <span className="font-brand">FRIZAME</span>
                <span className="text-[6pt] font-semibold tracking-wider uppercase">CONGELADOS PREMIUM</span>
              </div>

              {/* Body */}
              <div className="p-1.5 flex-1 flex flex-col justify-between">
                <h4 className="font-brand text-[8.5pt] font-bold uppercase border-b border-black pb-0.5 mb-1 leading-tight text-black">
                  {labelConfig.productoNombre}
                </h4>

                <div className="flex gap-1.5 flex-1">
                  {/* Left Column */}
                  <div className="flex-1 flex flex-col justify-between text-[6.5pt]">
                    <div>
                      {labelConfig.ingredientes && (
                        <p className="line-clamp-2 leading-tight text-[6pt]">
                          <strong>Ingred.:</strong> {labelConfig.ingredientes}
                        </p>
                      )}
                      {labelConfig.alergenos && (
                        <p className="font-bold text-[5.5pt] uppercase mt-0.5 leading-tight">
                          <strong>ALÉRGENOS:</strong> {labelConfig.alergenos}
                        </p>
                      )}
                    </div>

                    <div className="text-[6pt] text-gray-700 font-semibold mt-1">
                      <div><strong>Temp:</strong> {labelConfig.conservacion || '-18°C'}</div>
                    </div>
                  </div>

                  {/* Right Column (QR & Pictograms) */}
                  <div className="w-14 flex flex-col items-center justify-between border-l border-gray-400 pl-1">
                    {labelConfig.qrCodeUrl && (
                      <img
                        src={labelConfig.qrCodeUrl}
                        alt="QR Trazabilidad"
                        className="w-10 h-10 object-contain"
                      />
                    )}

                    <div className="flex gap-1 justify-center text-[5pt] font-bold text-center">
                      {labelConfig.picSarten && (
                        <div className="flex flex-col items-center">
                          <Flame className="w-2.5 h-2.5 text-black" />
                          <span>Sartén</span>
                        </div>
                      )}
                      {labelConfig.picHorno && (
                        <div className="flex flex-col items-center">
                          <UtensilsCrossed className="w-2.5 h-2.5 text-black" />
                          <span>Horno</span>
                        </div>
                      )}
                      {labelConfig.picSinDescongelar && (
                        <div className="flex flex-col items-center">
                          <Snowflake className="w-2.5 h-2.5 text-black" />
                          <span>Directo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Black Footer Bar */}
              <div className="bg-black text-white px-2 py-1 flex justify-between items-center text-[7.5pt] font-bold border-t border-black shrink-0">
                <span>{labelConfig.pesoNeto}</span>
                <span className="text-center font-bold text-white">L: {labelConfig.lote}</span>
                <span>{labelConfig.vencimiento}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
