import { DeleteIcon } from '@/components/icons/DeleteIcon';
import { EditIcon } from '@/components/icons/EditIcon';
import { Select } from '@/components/Select';
import { useGetSpendingCtx } from '@/context/SpendingProvider';
import { useGroupCtx } from '@/context/UserGroupProvider';
import { deleteItem } from '@/services/dbHandler';
import { SpendingType, USER_TOKEN_SEPARATOR } from '@/utils/constants';
import { normalizeNumber } from '@/utils/normalizeNumber';
import {
  ReactNode,
  useCallback,
  useMemo,
  useState,
  MouseEvent,
  useEffect,
} from 'react';

interface Props {
  date: Date;
  type: SpendingType;
  handleEdit: (record: SpendingRecord) => void;
}

enum FilterType {
  Today,
  ThisMonth,
}

export const SpendingList = (props: Props) => {
  const { data, loading } = useGetSpendingCtx();
  const { group } = useGroupCtx();
  const [isInitialed, setIsInitialed] = useState(false);
  const [filter, setFilter] = useState(FilterType.Today);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>();
  const year = props.date.getFullYear();
  const month = props.date.getMonth();
  const day = props.date.getDate();

  const getSelectedUser = useCallback(
    (
      users: {
        email: string;
        name: string;
        image: string;
      }[],
    ) => users.find((user) => user.email === selectedUserEmail),
    [selectedUserEmail],
  );

  const checkDate = useCallback(
    (dateStr: string) => {
      const date = new Date(dateStr);
      if (filter === FilterType.ThisMonth) {
        return date.getFullYear() === year && date.getMonth() === month;
      }
      return (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      );
    },
    [day, month, year, filter],
  );

  const filteredData = useMemo(
    () =>
      [...data]
        .filter((data) => data.type === props.type && checkDate(data.date))
        .filter((data) =>
          selectedUserEmail
            ? data['user-token'].split(USER_TOKEN_SEPARATOR)[0] ===
              selectedUserEmail
            : true,
        ),
    [data, props.type, checkDate, selectedUserEmail],
  );

  const totalAmount = filteredData.reduce(
    (acc, spending) => acc + spending.amount,
    0,
  );

  useEffect(() => {
    if (!loading) {
      setIsInitialed(true);
    }
  }, [loading]);

  return (
    <div className="flex w-full max-w-175 flex-1 flex-col justify-end gap-2 text-xs sm:text-sm lg:text-base">
      {!isInitialed && (
        <div className="mb-2 flex w-full items-center justify-center pb-96">
          <span>Loading...</span>
        </div>
      )}
      {isInitialed && (
        <>
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <FilterBtn
                selected={filter === FilterType.Today}
                onClick={() => setFilter(FilterType.Today)}
              >
                {`今天 (${month + 1}/${day})`}
              </FilterBtn>
              <FilterBtn
                selected={filter === FilterType.ThisMonth}
                onClick={() => setFilter(FilterType.ThisMonth)}
              >
                {`當月 (${month + 1}月)`}
              </FilterBtn>
              {group && (
                <Select
                  value={getSelectedUser(group.users)?.name ?? '全部'}
                  name="user"
                  onChange={setSelectedUserEmail}
                  className="rounded border border-solid border-gray-300 px-2 py-1 active:border-text sm:hover:border-text"
                >
                  <Select.Item value="" className="text-start text-gray-500">
                    全部
                  </Select.Item>
                  {group?.users.map((user) => (
                    <Select.Item key={user.email} value={user.email}>
                      {user.name}
                    </Select.Item>
                  ))}
                </Select>
              )}
            </div>
            <span>{`總共: $${normalizeNumber(totalAmount)}`}</span>
          </div>
          <div className="scrollbar flex h-96 w-full flex-col gap-1 overflow-y-auto overflow-x-hidden">
            {filteredData.map((spending, index) => (
              <Item
                key={`${spending.id}-${index.toString()}`}
                green={props.type === SpendingType.Income}
                spending={spending}
                handleEdit={props.handleEdit}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const FilterBtn = ({
  children,
  selected,
  onClick,
}: {
  children: ReactNode;
  selected: boolean;
  onClick: (event: MouseEvent) => void;
}) => {
  return (
    <button
      type="button"
      className={`rounded border border-solid px-2 py-1 transition-colors ${selected ? 'border-text bg-primary-100 text-black' : 'border-gray-300 active:border-text sm:hover:border-text'}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const Item = ({
  spending,
  green,
  handleEdit,
}: {
  spending: SpendingRecord;
  green: boolean;
  handleEdit: (record: SpendingRecord) => void;
}) => {
  const { syncData } = useGetSpendingCtx();
  const { group } = useGroupCtx();

  const userInfo = useMemo(
    () =>
      group?.users.find(
        (d) =>
          d.email === spending['user-token'].split(USER_TOKEN_SEPARATOR)[0],
      ),
    [group?.users, spending],
  );

  const handleOnEdit = () => {
    handleEdit(spending);
  };

  const handleOnDelete = useCallback(() => {
    if (!confirm('確定要刪除這筆資料嗎?')) return;
    deleteItem(spending.id).then(() => {
      syncData();
    });
  }, [spending.id, syncData]);

  return (
    <div
      className={`grid grid-cols-12 items-center gap-2 rounded border-l-4 border-solid p-2 odd:bg-gray-200 ${green ? 'border-green-500' : 'border-red-500'}`}
    >
      <div className="col-span-1 text-center">{spending.necessity}</div>
      <div className="col-span-1 flex items-center justify-center">
        <div className="rounded border border-solid border-text p-1">
          {spending.category}
        </div>
      </div>
      <div
        title={spending.description}
        className="col-span-5 overflow-hidden text-ellipsis whitespace-nowrap"
      >
        {`${userInfo ? `(${userInfo.name}) ` : ''}${spending.description}`}
      </div>
      <div className="col-span-2 text-end">
        ${normalizeNumber(spending.amount)}
      </div>
      <div className="col-span-3 flex items-center justify-end gap-px">
        <button
          onClick={handleOnEdit}
          className="group rounded p-2 transition-colors hover:bg-primary-300"
        >
          <EditIcon className="size-4 transition-colors group-hover:text-background" />
        </button>
        <button
          onClick={handleOnDelete}
          className="group rounded p-2 transition-colors hover:bg-red-300"
        >
          <DeleteIcon className="size-4 transition-colors group-hover:text-background" />
        </button>
      </div>
    </div>
  );
};
