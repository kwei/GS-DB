'use client';

import { DatePicker } from '@/components/DatePicker';
import { RefreshIcon } from '@/components/icons/RefreshIcon';
import { Select } from '@/components/Select';
import { EditorBlock } from '@/composites/EditorBlock';
import { SpendingList } from '@/composites/SpendingList';
import { useGroupCtx } from '@/context/GroupProvider';
import { useGetSpendingCtx } from '@/context/SpendingProvider';
import { useUserConfigCtx } from '@/context/UserConfigProvider';
import { useSpendingReducer } from '@/hooks/useSpendingReducer';
import { SpendingType } from '@/utils/constants';
import {
  ChangeEvent,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

export const SpendingInfoSection = () => {
  const [state, dispatch] = useSpendingReducer();
  const [selectedGroup, setSelectedGroup] = useState<string>();
  const [selectedMemberEmail, setSelectedMemberEmail] = useState<string>();
  const { config: userData } = useUserConfigCtx();
  const { syncData, loading } = useGetSpendingCtx();

  const handleOnChangeDate = (event: ChangeEvent) => {
    const date = new Date((event.target as HTMLInputElement).value);
    startTransition(() => {
      dispatch({
        type: 'SET_DATE',
        payload: date.toUTCString(),
      });
    });
  };

  const refreshData = useCallback(() => {
    syncData(selectedGroup, selectedMemberEmail);
  }, [selectedGroup, selectedMemberEmail, syncData]);

  const reset = () => {
    dispatch({ type: 'RESET' });
  };

  useEffect(() => {
    if (!selectedGroup && userData?.email) {
      setSelectedMemberEmail(userData.email);
    }
  }, [selectedGroup, userData?.email]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <div className="relative flex w-full flex-1 flex-col items-center gap-4 p-6">
      <div className="absolute right-6 top-6">
        <button
          type="button"
          onClick={refreshData}
          disabled={loading}
          className="rounded-md bg-gray-300 p-2 transition-colors active:bg-gray-400 sm:hover:bg-gray-400"
        >
          <RefreshIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <Switch
        type={state.type as SpendingType}
        onChange={(type) => {
          dispatch({
            type: 'SET_TYPE',
            payload: type,
          });
        }}
      />
      <DatePicker date={new Date(state.date)} onChange={handleOnChangeDate} />
      <div className="flex w-full max-w-175 flex-wrap justify-between gap-2">
        <GroupSelector
          selectedGroup={selectedGroup}
          selectedMemberEmail={selectedMemberEmail}
          onSelectGroup={setSelectedGroup}
          onSelectMemberEmail={setSelectedMemberEmail}
        />
        <button
          type="button"
          onClick={reset}
          className="w-fit rounded-md border border-solid border-gray-300 px-2 py-1 text-xs transition-colors active:border-text sm:text-sm sm:hover:border-text lg:text-base"
        >
          重置編輯器
        </button>
      </div>
      <EditorBlock
        key={state.id}
        data={state}
        groupId={selectedGroup}
        memberEmail={selectedMemberEmail}
        refreshData={refreshData}
        reset={reset}
      />
      <SpendingList
        type={state.type as SpendingType}
        date={new Date(state.date)}
        selectedDataId={state.id}
        handleEdit={(data) => {
          dispatch({
            type: 'RESET',
            payload: data,
          });
        }}
        refreshData={refreshData}
      />
    </div>
  );
};

const GroupSelector = ({
  selectedGroup,
  selectedMemberEmail,
  onSelectGroup,
  onSelectMemberEmail,
}: {
  selectedGroup?: string;
  selectedMemberEmail?: string;
  onSelectGroup: (groupId: string) => void;
  onSelectMemberEmail: (email?: string) => void;
}) => {
  const { groups, loading } = useGroupCtx();

  const group = useMemo(
    () => groups.find((group) => group.id === selectedGroup),
    [groups, selectedGroup],
  );

  const selectedMember = useMemo(
    () => group?.users.find((user) => user.email === selectedMemberEmail),
    [group?.users, selectedMemberEmail],
  );

  return (
    <div className="flex items-center gap-1 text-sm sm:text-base">
      <span>群組</span>
      <Select
        name="group"
        value={group?.name ?? '個人'}
        onChange={onSelectGroup}
        className="max-w-24 rounded-md border border-solid border-gray-300 px-2 py-1 transition-colors active:border-text sm:hover:border-text"
        menuStyle="max-w-32"
      >
        <Select.Item value="">個人</Select.Item>
        {!loading &&
          groups.map((group) => (
            <Select.Item key={group.id} value={group.id}>
              {group.name}
            </Select.Item>
          ))}
      </Select>

      {group && (
        <>
          <span>成員</span>
          <Select
            name="member"
            value={selectedMember?.name ?? '全部'}
            onChange={onSelectMemberEmail}
            className="max-w-24 rounded-md border border-solid border-gray-300 px-2 py-1 transition-colors active:border-text sm:hover:border-text"
          >
            <Select.Item value="">全部</Select.Item>
            {group.users.map((user) => (
              <Select.Item key={user.email} value={user.email}>
                {user.name}
              </Select.Item>
            ))}
          </Select>
        </>
      )}
    </div>
  );
};

const Switch = ({
  type,
  onChange,
}: {
  type: SpendingType;
  onChange: (type: SpendingType) => void;
}) => {
  const handleOnClick = (type: SpendingType) => {
    startTransition(() => {
      onChange(type);
    });
  };
  return (
    <div className="flex items-center gap-1 text-sm sm:text-base">
      <button
        className={`rounded-l border border-solid border-red-500 px-6 py-2 text-center transition-colors ${type === SpendingType.Outcome ? 'bg-red-300' : 'text-red-500 active:bg-red-300 active:text-text sm:hover:bg-red-300 sm:hover:text-text'}`}
        onClick={() => handleOnClick(SpendingType.Outcome)}
      >
        支出
      </button>
      <button
        className={`rounded-r border border-solid border-green-500 px-6 py-2 text-center transition-colors ${type === SpendingType.Income ? 'bg-green-300' : 'text-green-500 active:bg-green-300 active:text-text sm:hover:bg-green-300 sm:hover:text-text'}`}
        onClick={() => handleOnClick(SpendingType.Income)}
      >
        收入
      </button>
    </div>
  );
};
