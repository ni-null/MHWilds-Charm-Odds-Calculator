import React from "react"
import { useTranslation } from "react-i18next"

export default function ProbabilityExplanation() {
  const { t } = useTranslation()

  return (
    <div className='w-full p-5 mt-10 bg-white shadow-lg md:p-10 rounded-xl'>
      <div className='p-6 rounded-lg bg-lime-50'>
        <div className='space-y-4 text-gray-800'>
          <div>
            <strong className='text-lg text-green-700'>{t("probability.calculation.title")}</strong>
          </div>

          <div className='text-base font-medium text-gray-700'>{t("probability.calculation.subtitle")}</div>

          <div className='space-y-2'>
            <div className='font-medium'>{t("probability.calculation.rarityBase")}</div>
            <div className='p-2 font-mono text-sm bg-white rounded'>RARE[5] = 59% | RARE[6] = 27% | RARE[7] = 11% | RARE[8] = 3%</div>
            <div className='mt-1 text-xs text-green-600'>{t("probability.calculation.charmTypeCounts")}</div>
          </div>

          <div className='space-y-2 text-sm text-gray-700'>
            <div>• {t("probability.calculation.baseFormula")}</div>
            <div>• {t("probability.calculation.typeFormula")}</div>
            <div>• {t("probability.calculation.skillFormula")}</div>
          </div>

          <div className='space-y-3'>
            <div className='text-base font-medium'>{t("probability.calculation.explanation.title")}</div>
            <div className='pl-2 space-y-1 text-sm'>
              <div>{t("probability.calculation.explanation.step1")}</div>
              <div>{t("probability.calculation.explanation.step2")}</div>

              <div>{t("probability.calculation.explanation.step3")}</div>
              <div>{t("probability.calculation.explanation.step4")}</div>
              <div>{t("probability.calculation.explanation.step5")}</div>
            </div>
          </div>

          <div className='p-3 bg-white border border-gray-100 rounded shadow-sm'>
            <div className='mb-2 text-base font-medium text-gray-800'>{t("probability.calculation.example.title")}</div>
            <div className='space-y-1 text-sm'>
              <div>{t("probability.calculation.example.description")}</div>
              <div className='pl-2 space-y-0.5 mt-2'>
                <div>{t("probability.calculation.example.step1")}</div>
                <div>{t("probability.calculation.example.step2")}</div>
                <div>{t("probability.calculation.example.step3")}</div>
              </div>
              <div className='mt-2 font-medium'>{t("probability.calculation.example.result")}</div>
            </div>
          </div>

          <div className='space-y-2 text-sm text-gray-700'>
            <div className='font-semibold text-green-800'>{t("probability.note.title")}</div>
            <div className='space-y-1'>
              <div className='text-gray-700'>{t("probability.note.line1")}</div>
              <div className='text-gray-700'>{t("probability.note.line2")}</div>
              <div className='text-gray-700'>{t("probability.note.line3")}</div>
              <div className='text-gray-700'>{t("probability.note.line4")}</div>
              <div className='text-gray-700'>{t("probability.note.line5")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
