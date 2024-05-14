import React, { useState } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import { copilotApi } from "copilot-node-sdk";


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
    const expectedKeys = ['Company', 'Task', 'Description', 'Status', 'Due Date', 'Priority'];
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
  const token = context.query.token as string;
  const apiKey = process.env.COPILOT_API_KEY;
  let props = { tasks: [], error: "Not init" };

  if (apiKey && token) {
    const copilot = copilotApi({ apiKey, token });
    console.log('copilot object:', copilot);
    try {
      if (copilot && 'getTokenPayload' in copilot) {
        const tokenDetails = await copilot.getTokenPayload!(); 
        const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost:3000';
        const apiUrl = `http://${vercelUrl}/api/tasks`;
        const res = await fetch(apiUrl, {
          headers: {'Content-Type': 'application/json'}
        });

        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status}`);
        }

        const { tasks } = await res.json();
        props = { tasks: tasks.filter((task: Task) => task.Company === tokenDetails.companyId), error: "" };
      }
    } catch (error) {
      console.error("Error in getServerSideProps:", error);
      props.error = error instanceof Error ? error.message : "Couldn't fetch tasks.";
    }
  } else {
    props.error = "API key missing";
  }

  return { props };
}

export default Home;
