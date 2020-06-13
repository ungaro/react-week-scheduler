import Tippy from '@tippy.js/react';
import classcat from 'classcat';
import compareAsc from 'date-fns/compare_asc';
import format from 'date-fns/format';
import getDay from 'date-fns/get_day';
import getHours from 'date-fns/get_hours';
import getMinutes from 'date-fns/get_minutes';
import ar from 'date-fns/locale/ar';
import de from 'date-fns/locale/de';
import en from 'date-fns/locale/en';
import ja from 'date-fns/locale/ja';
import setDay from 'date-fns/set_day';
import setHours from 'date-fns/set_hours';
import setMinutes from 'date-fns/set_minutes';
import startOfWeek from 'date-fns/start_of_week';
// @ts-ignore
import humanizeDuration from 'humanize-duration';
import mapValues from 'lodash/mapValues';
import 'pepjs';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import CustomProperties from 'react-custom-properties';
import ReactDOM from 'react-dom';
import 'resize-observer-polyfill/dist/ResizeObserver.global';
import useUndo from 'use-undo';
import { DefaultEventRootComponent } from '../src/components/DefaultEventRootComponent';
import { TimeGridScheduler } from '../src/components/TimeGridScheduler';
import { SchedulerContext } from '../src/context';
import { useMousetrap } from '../src/hooks/useMousetrap';
import { classes as defaultClasses } from '../src/styles';
import { EventRootProps, ScheduleType } from '../src/types';
import DeleteIcon from './assets/outline-delete-24px.svg';
import { Key } from './components/Key/Key';
import demoClasses from './index.module.scss';

const locales = {
  ja,
  en,
  de,
  ar,
};

const classes = mapValues(
  defaultClasses,
  (value, key: keyof typeof defaultClasses) =>
    classcat([value, demoClasses[key]]),
);

const rangeStrings: [string, string][] = [
  ['2019-03-04 00:15', '2019-03-04 01:45'],
  ['2019-03-05 09:00', '2019-03-05 10:30'],
  ['2019-03-06 22:00', '2019-03-06 22:30'],
  ['2019-03-07 01:30', '2019-03-07 03:00'],
  ['2019-03-07 05:30', '2019-03-07 10:00'],
  ['2019-03-08 12:30', '2019-03-08 01:30'],
  ['2019-03-09 22:00', '2019-03-09 23:59'],
];

const defaultSchedule: ScheduleType = rangeStrings.map(
  (range) => range.map((dateString) => new Date(dateString)) as [Date, Date],
);

const EventRoot = React.forwardRef<any, EventRootProps>(function EventRoot(
  { handleDelete, disabled, ...props },
  ref,
) {
  return (
    <Tippy
      arrow
      interactive
      isEnabled={!disabled}
      hideOnClick={false}
      className={demoClasses.tooltip}
      content={
        <button disabled={disabled} onClick={handleDelete}>
          <DeleteIcon className={demoClasses.icon} />
          Delete
        </button>
      }
    >
      <DefaultEventRootComponent
        handleDelete={handleDelete}
        disabled={disabled}
        {...props}
        ref={ref}
      />
    </Tippy>
  );
});

function App() {
  const [weekStart, setWeekStart] = useState(1);
  const originDate = useMemo(
    () =>
      startOfWeek(new Date('2019-03-04'), {
        weekStartsOn: weekStart,
      }),
    [weekStart],
  );
  const defaultAdjustedSchedule = useMemo(
    () =>
      defaultSchedule
        .map(
          (range) =>
            [
              setMinutes(
                setHours(
                  setDay(originDate, getDay(range[0]), {
                    weekStartsOn: weekStart,
                  }),
                  getHours(range[0]),
                ),
                getMinutes(range[0]),
              ),
              setMinutes(
                setHours(
                  setDay(originDate, getDay(range[1]), {
                    weekStartsOn: weekStart,
                  }),
                  getHours(range[1]),
                ),
                getMinutes(range[1]),
              ),
            ] as [Date, Date],
        )
        .sort(([start], [end]) => compareAsc(start, end)),
    [weekStart, originDate],
  );
  const [
    scheduleState,
    {
      set: setSchedule,
      reset: resetSchedule,
      undo: undoSchedule,
      redo: redoSchedule,
      canUndo: canUndoSchedule,
      canRedo: canRedoSchedule,
    },
  ] = useUndo<ScheduleType>(defaultAdjustedSchedule);

  useMousetrap(
    'ctrl+z',
    () => {
      if (!canUndoSchedule) {
        return;
      }

      undoSchedule();
    },
    document,
  );

  useMousetrap(
    'ctrl+shift+z',
    () => {
      if (!canRedoSchedule) {
        return;
      }

      redoSchedule();
    },
    document,
  );

  const [verticalPrecision, setVerticalPrecision] = useState(15);
  const [
    visualGridVerticalPrecision,
    setVisualGridVerticalPrecision,
  ] = useState(60);
  const [cellClickPrecision, setCellClickPrecision] = useState(
    visualGridVerticalPrecision,
  );
  const [cellHeight, setCellHeight] = useState(45);
  const [cellWidth, setCellWidth] = useState(250);
  const [disabled, setDisabled] = useState(false);
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    setSchedule(defaultAdjustedSchedule);
    resetSchedule(defaultAdjustedSchedule);
  }, [defaultAdjustedSchedule, setSchedule, resetSchedule]);

  return (
    <>
      <div className={demoClasses['buttons-wrapper']}>
        <button
          type="button"
          disabled={!canUndoSchedule}
          onClick={undoSchedule}
        >
          ⟲ Undo
        </button>
        <button
          type="button"
          disabled={!canRedoSchedule}
          onClick={redoSchedule}
        >
          Redo ⟳
        </button>
        <label htmlFor="vertical_precision">
          Precision:
          <select
            name="vertical_precision"
            id="vertical_precision"
            value={verticalPrecision}
            onChange={({ target: { value } }) =>
              setVerticalPrecision(Number(value))
            }
          >
            {[5, 10, 15, 30, 60].map((value) => (
              <option key={value} value={value}>
                {humanizeDuration(value * 60 * 1000)}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="disabled">
          <input
            id="disabled"
            type="checkbox"
            name="disabled"
            checked={disabled}
            onChange={(e) => setDisabled(Boolean(e.target.checked))}
          />
          Disabled
        </label>
        <label style={{ display: 'none' }} htmlFor="start_of_week">
          Start of week:
          <select
            name="start_of_week"
            id="start_of_week"
            value={weekStart}
            onChange={({ target: { value } }) => setWeekStart(Number(value))}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((value) => (
              <option key={value} value={value}>
                {format(setDay(new Date(), value), 'ddd dS', {
                  locale: locales[locale],
                })}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="visual_grid_vertical_precision">
          Grid increments:
          <select
            name="visual_grid_vertical_precision"
            id="visual_grid_vertical_precision"
            value={visualGridVerticalPrecision}
            onChange={({ target: { value } }) =>
              setVisualGridVerticalPrecision(Number(value))
            }
          >
            {[15, 30, 60].map((value) => (
              <option key={value} value={value}>
                {humanizeDuration(value * 60 * 1000)}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="min_cell_click_precision">
          Min click precision:
          <select
            name="min_cell_click_precision"
            id="min_cell_click_precision"
            value={cellClickPrecision}
            onChange={({ target: { value } }) =>
              setCellClickPrecision(Number(value))
            }
          >
            {[15, 30, 60].map((value) => (
              <option key={value} value={value}>
                {humanizeDuration(value * 60 * 1000)}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="locale">
          Locale:
          <select
            name="locale"
            id="locale"
            value={locale}
            onChange={({ target: { value } }) => {
              setLocale(value);
            }}
          >
            {['en', 'ar', 'ja', 'de'].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="cell_height">
          Cell height:
          <input
            id="cell_height"
            name="cell_height"
            type="range"
            max={100}
            step={10}
            min={30}
            value={cellHeight}
            onChange={({ target: { value } }) => setCellHeight(Number(value))}
          />
        </label>
        <label htmlFor="cell_width">
          Preferred cell width:
          <input
            id="cell_width"
            name="cell_width"
            type="range"
            max={300}
            step={25}
            min={150}
            value={cellWidth}
            onChange={({ target: { value } }) => setCellWidth(Number(value))}
          />
        </label>
        <div>
          Tip: use <Key>Delete</Key> key to remove time blocks. <Key>↑</Key>{' '}
          and <Key>↓</Key> to move.
        </div>
      </div>
      <CustomProperties
        global={false}
        properties={{
          '--cell-height': `${cellHeight}px`,
          '--cell-width': `${cellWidth}px`,
        }}
      >
        <Fragment key={`${cellHeight},${cellWidth}`}>
          <SchedulerContext.Provider value={{ locale: locales[locale] }}>
            <TimeGridScheduler
              key={originDate.toString()}
              classes={classes}
              originDate={originDate}
              schedule={scheduleState.present}
              onChange={setSchedule}
              verticalPrecision={verticalPrecision}
              visualGridVerticalPrecision={visualGridVerticalPrecision}
              cellClickPrecision={cellClickPrecision}
              eventRootComponent={EventRoot}
              disabled={disabled}
            />
          </SchedulerContext.Provider>
        </Fragment>
      </CustomProperties>
    </>
  );
}

const rootElement = document.getElementById('root');

ReactDOM.render(<App />, rootElement);
