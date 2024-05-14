import React, { useState } from 'react';
import { NextPage, GetServerSideProps } from 'next';

interface Task {
  Company?: string;
  Task?: string;
  Description?: string;
  Status?: string;
  'Due date'?: string;
  Priority?: string;
  [key: string]: any; 
}

interface HomeProps {
  tasks: Task[];
  error?: string;
}

const Home: NextPage<HomeProps> = ({ tasks, error }) => {
  const [searchText, setSearchText] = useState('');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const filteredTasks = tasks.filter(task =>
    Object.values(task).some(value =>
      typeof value === 'string' ? value.toLowerCase().includes(searchText.toLowerCase()) :
      typeof value === 'object' ? Object.values(value).join(' ').toLowerCase().includes(searchText.toLowerCase()) :
      false
    )
  );

  const renderValue = (task: Task) => {
    const expectedKeys = ['Company', 'Task', 'Description', 'Status', 'Due date', 'Priority'];
    return expectedKeys.map(key => (
      <div className="value-container" key={key}>
        <div className="value-key">{key}</div>
        <div className="value-content">{task[key] ? task[key].toString() : ''}</div>
      </div>
    ));
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <input
        type="text"
        className="search-input"
        placeholder="Search"
        value={searchText}
        onChange={handleSearchChange}
      />
      <ul>
        {filteredTasks.map(task => (
          <li key={task.id} className="task-list-item">
            {renderValue(task)}
          </li>
        ))}
      </ul>
    </div>
  );
};


export const getServerSideProps: GetServerSideProps = async (context) => {
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost:3000';
  const apiUrl = `http://${vercelUrl}/api/tasks`;
  console.log('getServerSideProps API URL:', apiUrl);  
  console.log('getServerSideProps vercel URL:', vercelUrl);  


  try {
    const res = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('getServerSideProps: Fetch response status:', res.status); 
    const resText = await res.text();
    // console.log('getServerSideProps: Fetch response text:', resText); 

    if (!res.ok) {
      console.error('getServerSideProps http error:', res.status, 'desc:', resText);
      throw new Error(`HTTP error! Status: ${res.status}, desc: ${resText}`);
    }

    const { tasks } = JSON.parse(resText);
    // console.log('getServerSideProps: Fetched tasks:', tasks); 

    if (!tasks.length) {
      return { props: { tasks: [], error: 'No tasks' } };
    }

    return { props: { tasks: tasks || [] } };
  } catch (error: unknown) {
    let errorMessage = 'Cant fetch tasks';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error in getServerSideProps", errorMessage);
    return { props: { tasks: [], error: errorMessage } };
  }
};






export default Home;
